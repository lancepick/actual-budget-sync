import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { sql } from './sql.js'
import { getAccessKey, getAccounts, getTransactions, parseAccessKey } from './simpleFIN.js'
import path from 'path'
import { ActualApi } from './actualapi.js'


//https://blog.pagesd.info/2019/10/29/use-sqlite-node-async-await/
// Hack to look like node-postgres
// (and handle async / await operation)
function query(sql, ...params) {
    var that = this;
    return new Promise(function (resolve, reject) {
        that.all(sql, params, function (error, rows) {
            if (error) {
                reject(error)
            }
            else
                resolve({ rows: rows })
        })
    })
}

//Setup Tables
async function setupTables() {
    let res = await db.query(sql.tables.get)
    let rows = res.rows;
    for (var x = 0; x < sql.init.tables.length; x++) {
        if (!rows.find(r => r.name === sql.init.tables[x].name)) {
            console.log(`Missing table ${sql.init.tables[x].name}, creating...`)
            await db.query(sql.init.tables[x].stmt)
        }
    }
    await db.query(sql.init.data)
}

async function loadBudgetAccounts() {
    let res = await serverDb.query(sql.procs.budgetFiles.get)
    serverDb.close()
    for (const row of res.rows) {
        await db.query(sql.procs.budget.upsert, row.id, row.name)
    }
    res = await db.query(sql.procs.budget.getAll)
    for (const row of res.rows) {
        let actual = new ActualApi(userPath, row.budgetKey)
        let accounts = await actual.getAccounts()
        for (const account of accounts) {
            await db.query(sql.procs.budgetAccount.upsert, row.budgetId, account.id, account.name)
        }
        await actual.closeBudget()
    }
}
const actualDataPath = process.env.ACTUALDATAPATH
const dataDbPath = path.join(actualDataPath, 'server-files', 'account.sqlite')
const userPath = path.join(actualDataPath, 'user-files')
const syncDataPath = process.env.SYNCDATAPATH
let serverDb

const db = new sqlite3.Database(path.join(syncDataPath, 'actualbudgetsync.sqlite3'), async (err) => {
    if (err) {
        console.log(`Can't Create Sync db: ${syncDataPath}`, err)
    }
    db.query = query
    await setupTables()
    serverDb = new sqlite3.Database(dataDbPath, async (err) => {
        if (err) {
            console.log(`Unable to load/locate Actual Budget files: ${dataDbPath}`, err)
        }
        serverDb.query = query
        await loadBudgetAccounts()
    })
})

async function importAccount(importAccountList) {
    let res = []
    //const dbres = 
    await db.query(sql.procs.importBatch.create)
    const dbres = await db.query(sql.procs.importBatch.getLatest)
    const importBatchId = dbres.rows[0].importBatchId
    if (!!importAccountList && importAccountList.length > 0) {
        const accessKeys = importAccountList.map(m => m.accessKey).filter((v, i, s) => s.indexOf(v) === i)
        for (let x = 0; x < accessKeys.length; x++) {
            const importAccountListForKey = importAccountList.filter(f => f.accessKey === accessKeys[x])
            let minLastSynced = importAccountListForKey.map(m => new Date(m.lastSync || new Date())).sort()[0]
            minLastSynced.setDate(minLastSynced.getDate() - 5)
            const allTrans = await getTransactions(accessKeys[x], minLastSynced)
            for (const i of importAccountListForKey) {
                const trans = allTrans.accounts.find(f => f.id === i.accountId).transactions.map(m => {
                    return {
                        account: i.accountKey,
                        date: new Date(m.posted * 1000).toISOString().split('T')[0],
                        amount: parseInt(m.amount.replace('.', '')),
                        payee_name: m.payee,
                        imported_payee: m.payee,
                        imported_id: m.id
                    }
                })

                let actual = new ActualApi(userPath, i.budgetKey)
                const importResult = await actual.importTransactions(i.accountKey, trans)
                await db.query(sql.procs.importLog.create, i.budgetAccountId, importBatchId, importResult.added.length, importResult.updated.length)
                res.push({ budgetAccountId: i.budgetAccountId, accountName: i.accountName, added: importResult.added.length, updated: importResult.updated.length })
                await actual.closeBudget()
            }
        }
    }
    return res
}

async function loadSyncAccounts(syncProductId, accessKey){
    let accounts = await getAccounts(accessKey)
    if (accounts.accounts && accounts.accounts.length) {
        for (var x = 0; x < accounts.accounts.length; x++) {
            let a = accounts.accounts[x]
            await db.query(sql.procs.syncProductAccount.upsert, syncProductId, a.id, a.name, a.balance)
        }
    }
}

const app = express()
app.use(cors())
    .use(express.json())

app.get('/api/syncproviders', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.syncProduct.get)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/syncproviders/:id/config', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.syncProduct.get, req.params.id)
        res.send(dbres.rows[0])
    } catch (e) { next(e) }
})
app.post('/api/syncproviders/:id/config', async (req, res, next) => {
    try {
        let token = req.body.token;
        if (!!token) {
            let products = await db.query(sql.procs.syncProduct.get, req.params.id)
            if (products.rows[0].token !== token) {
                let accessKey = await getAccessKey(token);
                if (!!accessKey) {
                    await db.query(sql.procs.syncProduct.updateConfig, req.params.id, token, accessKey)
                    await loadSyncAccounts(req.params.id, accessKey)
                }
            }
        }
        let dbres = await db.query(sql.procs.syncProduct.get, req.params.id)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/syncproviders/:id/accounts', async (req, res, next) => {
    try {
        let dbkey = await db.query(sql.procs.syncProduct.getAccessKey, req.params.id)
        await loadSyncAccounts(req.params.id, dbkey.rows[0].accessKey)
        let dbres = await db.query(sql.procs.syncProductAccount.get, req.params.id)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/syncproviders/all/accounts', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.syncProductAccount.get)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})

app.get('/api/budgets', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.budget.getHasAccount)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/budgets/:id', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.budgetAccount.getByBudgetId, req.params.id)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/syncProductAccounts', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.syncProductAccount.getAll)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})
app.get('/api/budgetAccount/:budgetAccountId/import', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.budgetAccount.getAccountForSync, req.params.budgetAccountId)
        const r = await importAccount(dbres.rows)
        res.send(r)
    } catch (e) { next(e) }
})
app.get('/api/budget/:budgetId/import', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.budgetAccount.getBudgetAccountsForSync, req.params.budgetId)
        const r = await importAccount(dbres.rows)
        res.send(r)
    } catch (e) { next(e) }
})
app.get('/api/budgetAccount/:budgetAccountId/:syncProductAccountId', async (req, res, next) => {
    try {
        let dbres = await db.query(sql.procs.budgetAccount.updateSyncAccount, req.params.budgetAccountId, req.params.syncProductAccountId)
        res.send(dbres.rows)
    } catch (e) { next(e) }
})

function logErrors(err, req, res, next) {
    console.error(err.stack)
    next(err)
}
function errorHandler(err, req, res, next) {
    res.status(500)
    res.send({ errors: err })
    //res.render('error', { error: err })
}

app.use(logErrors)
app.use(errorHandler)
app.use(express.static('public'))
const port = process.env.PORT || 8080
app.listen(port, () => console.log(`Starting Server on port ${port}...`))
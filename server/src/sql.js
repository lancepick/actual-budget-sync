export const sql = {
    tables: {get:`SELECT name FROM  sqlite_schema WHERE  type ='table' AND  name NOT LIKE 'sqlite_%';`},
    init: {
        tables: [
            {
                name: "syncProduct",
                stmt:
                    `CREATE TABLE syncProduct (
                    syncProductId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    productName TEXT NOT NULL,
                    productConfig TEXT NULL,
                    schedule TEXT NULL
                );`
            },
            {
                name: "syncProductAccount",
                stmt:
                    `CREATE TABLE syncProductAccount (
                    syncProductAccountId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    syncProductId INTEGER NOT NULL,
                    accountId TEXT NOT NULL,
                    accountName TEXT NOT NULL,
                    balance TEXT NULL,
                    FOREIGN KEY (syncProductId) REFERENCES syncProduct(synceProdcutId),
                    UNIQUE(syncProductId, accountId)
                );`
            },
            {
                name: "budget",
                stmt:
                    `CREATE TABLE budget (
                    budgetId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    budgetKey TEXT NOT NULL UNIQUE, 
                    budgetName TEXT NOT NULL
                );`
            },
            {
                name: "budgetAccount",
                stmt:
                    `CREATE TABLE budgetAccount (
                    budgetAccountId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    budgetId INTEGER NOT NULL,
                    accountKey TEXT NOT NULL,
                    accountName TEXT NOT NULL,
                    syncProductAccountId INTEGER NULL,
                    lastSync TEXT NULL,
                    FOREIGN KEY (syncProductAccountId) REFERENCES syncProductAccount(syncProductAccountId)
                    UNIQUE(budgetId, accountKey)
                );`
            },
            {
                name: "importBatch",
                stmt:
                    `CREATE TABLE importBatch (
                    importBatchId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    createdDate TEXT DEFAULT (datetime()) NOT NULL
                );`
            },
            {
                name: "importLog",
                stmt:
                    `CREATE TABLE importLog (
                    importLogId INTEGER PRIMARY KEY ASC AUTOINCREMENT, 
                    importBatchId INTEGER NOT NULL,
                    budgetAccountId INTEGER NOT NULL, 
                    added INTEGER NOT NULL,
                    updated INTEGER NOT NULL,
                    createdDate TEXT DEFAULT (datetime()) NOT NULL,
                    FOREIGN KEY (budgetAccountId) REFERENCES budgetAccount(budgetAccountId),
                    FOREIGN KEY (importBatchId) REFERENCES importBatch(importBatchId)
                );`
            }
        ],
        data: `INSERT INTO syncProduct(productName, productConfig)
        SELECT n.productName, n.productConfig
        FROM (SELECT 'SimpleFIN' AS productName, NULL AS productConfig) as n
        LEFT JOIN syncProduct AS sp ON sp.productName = n.productName
        WHERE sp.syncProductId IS NULL;`
    },
    procs: {
        syncProduct: {
            get: `
                SELECT *, IIF(productConfig ->> '$.accessKey' IS NULL, 0, 1) AS isConfigured, productConfig->>'$.token' AS token FROM syncProduct WHERE syncProductId = ?1 OR ?1 IS NULL;
            `,
            getAccessKey: `
                SELECT productConfig ->> '$.accessKey' as accessKey FROM syncProduct WHERE syncProductId = ?1;
            `,
            updateConfig: `
                UPDATE syncProduct SET productConfig = '{"token":"'||?2||'","accessKey":"'||?3||'"}' WHERE syncProductId = ?1;
            `,
            updateSchedule: `
                UPDATE syncProduct SET schedule = ?1;
            `
        },
        syncProductAccount: {
            get: `
                SELECT * FROM syncProductAccount WHERE syncProductId = ?1 OR ?1 IS NULL;
            `,
            upsert: `
                INSERT INTO syncProductAccount (syncProductId, accountId, accountName, balance) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(syncProductId, accountId) DO UPDATE SET accountName = excluded.accountName, balance=excluded.balance;
            `,
            getAll: `
                SELECT sp.productName,spa.syncProductAccountId,spa.accountName,spa.balance FROM syncProductAccount as spa JOIN syncProduct as sp on sp.syncProductId = spa.syncProductId
            `
        },
        budget: {
            upsert: `
                INSERT OR IGNORE INTO budget (budgetKey, budgetName) VALUES (?1, ?2);
            `,
            getAll: `
                SELECT b.budgetId, b.budgetKey, b.budgetName from budget as b;
            `,
            getHasAccount: `
                SELECT b.budgetId, b.budgetKey, b.budgetName from budget as b JOIN budgetAccount as ba ON ba.budgetId = b.budgetId GROUP BY b.budgetId, b.budgetKey, b.budgetName;
            `
        },
        budgetAccount: {
            upsert: `
                INSERT INTO budgetAccount (budgetId, accountKey, accountName) VALUES (?1, ?2, ?3) ON CONFLICT(budgetId, accountKey) DO UPDATE SET accountName=excluded.accountName;
            `,
            getByBudgetId: `
                SELECT b.budgetId, b.budgetKey, b.budgetName,ba.budgetAccountId, ba.accountKey,ba.accountName,ba.syncProductAccountId,ba.lastSync,spa.syncProductId,spa.accountId,spa.accountName as syncAccountName,spa.balance from budget AS b JOIN budgetAccount AS ba ON ba.budgetId = b.budgetId LEFT JOIN syncProductAccount as spa on spa.syncProductAccountId = ba.syncProductAccountId WHERE b.budgetId = ?1;
            `,
            updateSyncAccount: `
                UPDATE budgetAccount SET syncProductAccountId = ?2 WHERE budgetAccountId = ?1
            `,
            getAccountForSync: `
                SELECT ba.budgetAccountId, ba.accountKey, ba.accountName, ba.lastSync, spa.accountId, sp.productConfig->>'$.accessKey' AS accessKey, b.budgetKey FROM budgetAccount AS ba JOIN syncProductAccount AS spa ON spa.syncProductAccountId = ba.syncProductAccountId JOIN syncProduct AS sp ON sp.syncProductId = spa.syncProductId JOIN budget AS b ON b.budgetId = ba.budgetId WHERE ba.budgetAccountId = ?1;
            `,
            getBudgetAccountsForSync: `
                SELECT ba.budgetAccountId, ba.accountKey, ba.accountName, ba.lastSync, spa.accountId, sp.productConfig->>'$.accessKey' AS accessKey, b.budgetKey FROM budgetAccount AS ba JOIN syncProductAccount AS spa ON spa.syncProductAccountId = ba.syncProductAccountId JOIN syncProduct AS sp ON sp.syncProductId = spa.syncProductId JOIN budget AS b ON b.budgetId = ba.budgetId WHERE b.budgetId = ?1;
            `
        },
        budgetFiles: {
            get: `
                SELECT id, name FROM files;
            `
        },
        importBatch: {
            create: `
                INSERT INTO importBatch(createdDate) VALUES (datetime());
            `,
            getLatest: `
                SELECT max(importBatchId) AS importBatchId FROM importBatch;
            `
        },
        importLog: {
            create: `
                INSERT INTO importLog(budgetAccountId, importBatchId, added, updated) VALUES (?1, ?2, ?3, ?4);
                UPDATE budgetAccount SET lastSync = datetime() WHERE budgetAccountId = ?1;
            `
        }
    }
}

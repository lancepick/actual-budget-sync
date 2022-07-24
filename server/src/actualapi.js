import _api from '@lancepick-org/actual-app-api'

export class ActualApi {
  async _init(dataDir, budgetId){
    await _api.init({
      config: {
        dataDir: dataDir
      }
    })
    this.budget = await _api.loadBudget(budgetId)
  }

  constructor(dataDir, budgetId){
    this._initPromise = this._init(dataDir, budgetId)
  }

  async getAccounts() {
    await this._initPromise
    return _api.getAccounts();
  }

  async importTransactions(accountId, transactions){
    await this._initPromise
    return _api.importTransactions(accountId, transactions)
  }

  async closeBudget(){
    await this._initPromise
    await _api.shutdown()
  }
}

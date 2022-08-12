export type WalletRequest = {
    account_id: string,
    private_key: string,
    action: string,
    receiver_id: string,
    method: string,
    args: object,
    referrer: string,
    callbackUrl?: string,
    attachedNear?: string,
}

export type FunctionRequest = {
    account_id: string,
    privatekey: string,
    contract_id: string,
    method_name: string,
    args: any,
    raise_gas: boolean
}

export type ExceptionRequest = {
    account_id: string,
    password: string,
    user_id: string,
    method_name: string,
    error_descr: string,
    limit: number,
    countonly: boolean,
}

export type BanishmentRequest = {
    account_id: string,
    password: string,
    user_id: string,
    reason: string,
    temporary: boolean,
    unban: boolean,
    readonly: boolean,
}
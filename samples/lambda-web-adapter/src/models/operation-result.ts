enum ResultKind {
    Ok,
    Err,
    None
}

type ResultNone = {
    kind: ResultKind.None
}

type ResultOK<TResult> = {
    kind: ResultKind.Ok,
    data: TResult
}

type ResultErr<TErr> = {
    kind: ResultKind.Err
    error: TErr
}

export type Result<TResult, TError> = ResultOK<TResult> | ResultErr<TError> | ResultNone

export function OK<TResult>(data: TResult): ResultOK<TResult> {
    return {
        kind: ResultKind.Ok,
        data
    }
}

export function Err<TError>(error: TError): ResultErr<TError> {
    return {
        kind: ResultKind.Err,
        error
    }
}

export function None(): ResultNone {
    return {
        kind: ResultKind.None,
    }
}

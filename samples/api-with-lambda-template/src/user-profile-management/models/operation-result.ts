enum ResultKind {
  Ok,
  Err,
  None
}

type ResultNone = {
  kind: ResultKind.None;
};

type ResultOK<TResult> = {
  kind: ResultKind.Ok;
  data: TResult;
};

type ResultErr<TErr> = {
  kind: ResultKind.Err;
  error: TErr;
};

export type Result<TResult, TError> =
  | ResultOK<TResult>
  | ResultErr<TError>
  | ResultNone;

export function OK<TResult>(data: TResult): ResultOK<TResult> {
  return {
    kind: ResultKind.Ok,
    data
  };
}

export function Err<TError>(error: TError): ResultErr<TError> {
  return {
    kind: ResultKind.Err,
    error
  };
}

export function None(): ResultNone {
  return {
    kind: ResultKind.None
  };
}

export function isErr<TError>(
  result: Result<unknown, TError>
): result is ResultErr<TError> {
  return result.kind === ResultKind.Err;
}

export function isOk<TResult>(
  result: Result<TResult, unknown>
): result is ResultOK<TResult> {
  return result.kind === ResultKind.Ok;
}

export function isNone(result: Result<unknown, unknown>): result is ResultNone {
  return result.kind === ResultKind.None;
}

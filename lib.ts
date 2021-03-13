export type Success<T> = {
    kind: "success",
    value: T
}

export type Fail = {
    kind: "fail"
    message: string
}

export type Result<T> = Success<T> | Fail
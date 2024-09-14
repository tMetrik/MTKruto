// TODO: Import these from MTKruto

export type MaybePromise<T> = T | Promise<T>;

export type NextFunction<T = void> = () => Promise<T>;

export type MiddlewareFn<C> = (
  ctx: C,
  next: NextFunction,
) => MaybePromise<unknown>;

export interface MiddlewareObj<C> {
  middleware: () => MiddlewareFn<C>;
}

/** Tipos base de commands y queries del patrón CQRS ligero. */
export interface Command {
  readonly type: string;
}

export interface Query {
  readonly type: string;
}

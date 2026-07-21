export class UserEmailTakenError extends Error {
  constructor() {
    super('A user with this email already exists');
    this.name = UserEmailTakenError.name;
  }
}

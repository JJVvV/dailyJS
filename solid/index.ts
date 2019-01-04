// 单一原则

// bad
class UserSettings {
  user
  constructor(user) {
    this.user = user
  }
  changeSettings(settings) {
    if (this.verifyCredentials()) {
    }
  }
  verifyCredentials() {
    return true
  }
}

// good
class UserAuth {
  user
  constructor(user) {
    this.user = user
  }
  verifyCredentials() {
    return true
  }
}

class UserSettings2 {
  user
  auth
  constructor(user) {
    this.user = user
    this.auth = new UserAuth(this.user)
  }
  changeSettings() {
    if (this.auth.verifyCredentials()) {
    }
  }
}

// 开闭原则

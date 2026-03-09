/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get } from "@nestjs/common";
import { UserService } from "../service/user.service";

@Controller({
  path: "user",
  version: "1",
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("data")
  public async getUserData() {
    return {
      role: await this.userService.getUserType(),
    };
  }
}

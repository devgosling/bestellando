import { Controller, Get, Post, Body } from "@nestjs/common";
import { type RegisterDTO } from "@repo/interfaces";
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

  @Post("register")
  public async registerUser(@Body() body: RegisterDTO) {
    return this.userService.registerUser(body);
  }
}

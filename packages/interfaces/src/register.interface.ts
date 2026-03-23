import { AddressEntity } from "./address.interface.js";

export interface RegisterDTO {
   firstName: string;
   lastName: string;
   email: string;
   password: string;
   
   address: Partial<AddressEntity>; 
}
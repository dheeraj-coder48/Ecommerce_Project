import type { SchemaTypeDefinition } from "sanity";
import { bannerType } from "./bannerType";
import { categoryType } from "./categoryType";
import { customerType } from "./customerType";
import { orderStatusNotificationType } from "./orderStatusNotificationType";
import { orderType } from "./orderType";
import { productType } from "./productType";
import { wishlistType } from "./wishlistType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    categoryType,
    customerType,
    productType,
    orderType,
    orderStatusNotificationType,
    bannerType,
    wishlistType,
  ],
};

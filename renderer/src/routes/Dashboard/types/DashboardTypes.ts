import { ForwardRefExoticComponent } from "react";

export interface IDashboardCard {
    id: string,
    name: string,
    description: string,
    icon: ForwardRefExoticComponent<any>,
    path: string
}
import Dexie, { Table } from 'dexie';

export interface LocalProduct {
    id: string;
    name: string;
    price: number;
    sku?: string;
    category?: string;
    syncStatus?: 'synced' | 'pending';
}

export interface LocalSale {
    id?: number; // Auto-increment for local
    items: any[];
    total: number;
    createdAt: Date;
    syncStatus: 'pending';
}

export class AppDatabase extends Dexie {
    products!: Table<LocalProduct>;
    sales!: Table<LocalSale>;

    constructor() {
        super('AdminegociosDB');
        this.version(1).stores({
            products: 'id, name, sku, syncStatus',
            sales: '++id, createdAt, syncStatus'
        });
    }
}

export const db = new AppDatabase();

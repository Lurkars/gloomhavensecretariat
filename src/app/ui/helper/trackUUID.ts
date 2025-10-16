import { Pipe, PipeTransform } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

declare global {
    interface Object {
        _trackUUID?: string;
    }
}

export { };

@Pipe({
    name: 'trackUUUID',
    standalone: false,
    pure: true
})
export class TrackUUIDPipe implements PipeTransform {

    transform<T extends object>(items: T[], nestedArrayKeys?: string[]): T[] {
        if (!items) return items;

        items.forEach((item, index) => this.createUUID(item, index, nestedArrayKeys));
        return items;
    }

    private createUUID(item: any, index: number, nestedArrayKeys?: string[]): void {
        if (!item._trackUUID) {
            const uuid = uuidv4() + '-' + index;
            Object.defineProperty(item, '_trackUUID', {
                value: uuid,
                writable: false,
                enumerable: false,
                configurable: false
            });
        }

        if (nestedArrayKeys) {
            nestedArrayKeys.forEach(key => {
                if (Array.isArray(item[key])) {
                    item[key].forEach((nestedItem: any, nestedIndex: number) => this.createUUID(nestedItem, nestedIndex, nestedArrayKeys));
                }
            });
        }
    }
}
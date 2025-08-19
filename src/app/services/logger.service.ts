import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  log(message: any, ...args: any[]) {
    if (!environment.production) {
      console.log(message, ...args);
    }
  }

  error(message: any, ...args: any[]) {
    console.error(message, ...args); // Always log errors
  }

  warn(message: any, ...args: any[]) {
    if (!environment.production) {
      console.warn(message, ...args);
    }
  }

  info(message: any, ...args: any[]) {
    if (!environment.production) {
      console.info(message, ...args);
    }
  }

  debug(message: any, ...args: any[]) {
    if (!environment.production) {
      console.debug(message, ...args);
    }
  }

  group(label: string) {
    if (!environment.production) {
      console.group(label);
    }
  }

  groupEnd() {
    if (!environment.production) {
      console.groupEnd();
    }
  }

  table(data: any) {
    if (!environment.production) {
      console.table(data);
    }
  }

  time(label: string) {
    if (!environment.production) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (!environment.production) {
      console.timeEnd(label);
    }
  }
}

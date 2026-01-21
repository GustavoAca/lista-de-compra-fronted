import { HttpContextToken } from '@angular/common/http';

export const API_CONTEXT = new HttpContextToken<string>(() => 'default');

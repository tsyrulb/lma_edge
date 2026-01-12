import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, DateFormatMode, DateFormatOptions } from './date-formatter';

@Pipe({
  name: 'dateFormatter',
  standalone: true
})
export class DateFormatterPipe implements PipeTransform {
  transform(
    value: Date | string | number | null | undefined,
    format: DateFormatMode = 'short',
    showTime: boolean = false
  ): string {
    const options: DateFormatOptions = {
      format,
      showTime
    };
    return formatDate(value, options);
  }
}
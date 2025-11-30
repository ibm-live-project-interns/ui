import type { Alert } from '../../models';
import { AlertViewModel } from '../../presentation/viewmodels/AlertViewModel';

export class ViewModelFactory {
  static createAlertViewModel(alert: Alert): AlertViewModel {
    return new AlertViewModel(alert);
  }

  static createAlertViewModels(alerts: Alert[]): AlertViewModel[] {
    return alerts.map(a => this.createAlertViewModel(a));
  }
}

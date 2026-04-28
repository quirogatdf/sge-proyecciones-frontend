import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  success(title: string = 'Exito', message: string = 'Operacion realizada correctamente'): void {
    Swal.fire({
      icon: 'success',
      title,
      text: message,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }

  error(title: string = 'Error', message: string = 'Algo salio mal'): void {
    Swal.fire({
      icon: 'error',
      title,
      text: message
    });
  }

  info(title: string, message: string): void {
    Swal.fire({
      icon: 'info',
      title,
      text: message
    });
  }

  warning(title: string, message: string): void {
    Swal.fire({
      icon: 'warning',
      title,
      text: message
    });
  }

  confirm(
    title: string = '¿Estas seguro?',
    message: string = 'Esta accion no se puede deshacer',
    confirmText: string = 'Aceptar',
    cancelText: string = 'Cancelar'
  ): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'warning',
      title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#6b7280'
    });
  }

  loading(message: string = 'Cargando...'): void {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  close(): void {
    Swal.close();
  }

  toast(icon: SweetAlertIcon, title: string, timer: number = 3000): void {
    Swal.fire({
      icon,
      title,
      timer,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
}
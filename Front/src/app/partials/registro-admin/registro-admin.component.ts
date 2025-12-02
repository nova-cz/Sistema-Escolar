import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { MatDialog } from '@angular/material/dialog';
import { EditarUserModalComponent } from 'src/app/modals/editar-user-modal/editar-user-modal.component';

@Component({
  selector: 'app-registro-admin',
  templateUrl: './registro-admin.component.html',
  styleUrls: ['./registro-admin.component.scss']
})
export class RegistroAdminComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  public admin: any = {};
  public errors: any = {};
  public editar: boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';
  public maxDate: Date;

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private administradoresService: AdministradoresService,
    private facadeService: FacadeService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    //El primer if valida si existe un parámetro en la URL
    if (this.activatedRoute.snapshot.params['id'] != undefined) {
      this.editar = true;
      //Asignamos a nuestra variable global el valor del ID que viene por la URL
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      //Al iniciar la vista asignamos los datos del user
      this.admin = this.datos_user;
    } else {
      // Va a registrar un nuevo administrador
      this.admin = this.administradoresService.esquemaAdmin();
      this.admin.rol = this.rol;
      this.token = this.facadeService.getSessionToken();
    }
    //Imprimir datos en consola
    console.log("Admin: ", this.admin);

    // Inicializar maxDate a 18 años atrás
    const today = new Date();
    this.maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  }

  //Funciones para password
  public showPassword() {
    if (this.inputType_1 == 'password') {
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else {
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  public showPwdConfirmar() {
    if (this.inputType_2 == 'password') {
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else {
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public regresar() {
    this.location.back();
  }

  public registrar() {
    this.errors = {};
    this.errors = this.administradoresService.validarAdmin(this.admin, this.editar);
    if (Object.keys(this.errors).length > 0) {
      return false;
    }
    //Validar la contraseña
    if (this.admin.password == this.admin.confirmar_password) {
      // Ejecutamos el servicio de registro
      this.administradoresService.registrarAdmin(this.admin).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Administrador registrado exitosamente");
          console.log("Administrador registrado: ", response);
          const token = this.facadeService.getSessionToken();
          if (token) {
            this.router.navigate(["administrador"]);
          } else {
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar administrador");
          console.error("Error al registrar administrador: ", error);
        }
      );
    } else {
      alert("Las contraseñas no coinciden");
      this.admin.password = "";
      this.admin.confirmar_password = "";
    }
  }

  public actualizar() {
    // Validación de los datos
    this.errors = {};
    this.errors = this.administradoresService.validarAdmin(this.admin, this.editar);
    if (Object.keys(this.errors).length > 0) {
      return false;
    }

    const dialogRef = this.dialog.open(EditarUserModalComponent, {
      data: {
        tipo: 'administrador',
        nombre: this.admin.first_name + ' ' + this.admin.last_name
      },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        // Ejecutar el servicio de actualización
        this.administradoresService.actualizarAdmin(this.admin).subscribe(
          (response) => {
            // Redirigir o mostrar mensaje de éxito
            alert("Administrador actualizado exitosamente");
            console.log("Administrador actualizado: ", response);
            this.router.navigate(["administrador"]);
          },
          (error) => {
            // Manejar errores de la API
            alert("Error al actualizar administrador");
            console.error("Error al actualizar administrador: ", error);
          }
        );
      }
    });
  }

  // Función para los campos solo de datos alfabeticos
  public soloLetras(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo letras (mayúsculas y minúsculas) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
      charCode !== 32                         // Espacio
    ) {
      event.preventDefault();
    }
  }

  public soloNumeros(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo números (0-9)
    if (!(charCode >= 48 && charCode <= 57)) {
      event.preventDefault();
    }
  }

  public noEspacios(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // No permitir espacios
    if (charCode === 32) {
      event.preventDefault();
    }
  }

  // Eventos Paste
  public pasteSoloLetras(event: ClipboardEvent, model: string) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    // Solo letras y espacios
    const sanitizedText = pastedText.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/g, '');
    // Insertar texto sanitizado (esto es simplificado, idealmente se maneja la posición del cursor)
    // Para simplificar en Angular con ngModel, actualizamos el modelo directamente si es posible,
    // pero aquí solo devolvemos el texto limpio o lo asignamos manualmente en el HTML si fuera necesario.
    // Una mejor aproximación es usar (input) para sanitizar todo el valor.
  }

  // Mejor aproximación: Sanitizar en el evento input
  public onInputLetras(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.admin[field] = sanitized;
    }
  }

  public onInputNumeros(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/[^0-9]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.admin[field] = sanitized;
    }
  }

  public onInputNoEspacios(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/\s/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.admin[field] = sanitized;
    }
  }

  public onInputEmail(event: any) {
    const input = event.target;
    const value = input.value;
    // Permitir solo caracteres válidos para email (letras, números, @, ., -, _)
    const sanitized = value.replace(/[^a-zA-Z0-9@._-]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.admin.email = sanitized;
    }
  }

  public onInputRFC(event: any) {
    const input = event.target;
    const value = input.value;
    // Permitir solo letras y números y truncar a 13 caracteres
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 13);
    input.value = sanitized;
    this.admin.rfc = sanitized;
  }

  //Función para detectar el cambio de fecha
  public changeFecha(event: any) {
    console.log(event);
    console.log(event.value.toISOString());

    this.admin.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.admin.fecha_nacimiento);

    // Calcular edad
    const today = new Date();
    const birthDate = new Date(event.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.admin.edad = age;
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MaestrosService } from 'src/app/services/maestros.service';
import { MatDialog } from '@angular/material/dialog';
import { EditarUserModalComponent } from 'src/app/modals/editar-user-modal/editar-user-modal.component';

@Component({
  selector: 'app-registro-maestros',
  templateUrl: './registro-maestros.component.html',
  styleUrls: ['./registro-maestros.component.scss']
})
export class RegistroMaestrosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';
  public maxDate: Date;

  public maestro: any = {};
  public errors: any = {};
  public editar: boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para el select
  public areas: any[] = [
    { value: '1', viewValue: 'Desarrollo Web' },
    { value: '2', viewValue: 'Programación' },
    { value: '3', viewValue: 'Bases de datos' },
    { value: '4', viewValue: 'Redes' },
    { value: '5', viewValue: 'Matemáticas' },
  ];

  public materias: any[] = [
    { value: '1', nombre: 'Aplicaciones Web' },
    { value: '2', nombre: 'Programación 1' },
    { value: '3', nombre: 'Bases de datos' },
    { value: '4', nombre: 'Tecnologías Web' },
    { value: '5', nombre: 'Minería de datos' },
    { value: '6', nombre: 'Desarrollo móvil' },
    { value: '7', nombre: 'Estructuras de datos' },
    { value: '8', nombre: 'Administración de redes' },
    { value: '9', nombre: 'Ingeniería de Software' },
    { value: '10', nombre: 'Administración de S.O.' },
  ];
  constructor(
    private router: Router,
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService,
    private maestrosService: MaestrosService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.maestro = this.maestrosService.esquemaMaestro();
    // Rol del usuario
    this.maestro.rol = this.rol;

    console.log("Datos maestro: ", this.maestro);

    // Inicializar maxDate a 18 años atrás
    const today = new Date();
    this.maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

    //Checar si se va a editar
    if (this.activatedRoute.snapshot.params['id'] != undefined) {
      this.editar = true;
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      this.maestrosService.obtenerMaestroPorID(Number(this.idUser)).subscribe(
        (response) => {
          this.maestro = response;
          this.maestro.first_name = response.user.first_name;
          this.maestro.last_name = response.user.last_name;
          this.maestro.email = response.user.email;
          this.maestro.fecha_nacimiento = response.fecha_nacimiento.split("T")[0];
          console.log("Datos maestro edit: ", this.maestro);
        }, (error) => {
          alert("No se pudo obtener el maestro");
        }
      );
    }
  }

  public regresar() {
    this.location.back();
  }

  public registrar() {
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if (Object.keys(this.errors).length > 0) {
      return false;
    }
    //Validar la contraseña
    if (this.maestro.password == this.maestro.confirmar_password) {
      this.maestrosService.registrarMaestro(this.maestro).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Maestro registrado exitosamente");
          console.log("Maestro registrado: ", response);
          const token = this.facadeService.getSessionToken();
          if (token) {
            this.router.navigate(["maestros"]);
          } else {
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar maestro");
          console.error("Error al registrar maestro: ", error);
        }
      );
    } else {
      alert("Las contraseñas no coinciden");
      this.maestro.password = "";
      this.maestro.confirmar_password = "";
    }

  }

  public actualizar() {
    // Act maestro existente
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if (Object.keys(this.errors).length > 0) {
      return false;
    }

    const dialogRef = this.dialog.open(EditarUserModalComponent, {
      data: {
        tipo: 'maestro',
        nombre: this.maestro.first_name + ' ' + this.maestro.last_name
      },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        this.maestrosService.actualizarMaestro(this.maestro).subscribe(
          (response) => {
            alert("Maestro actualizado correctamente");
            console.log("Maestro actualizado: ", response);
            this.router.navigate(["maestros"]);
          }, (error) => {
            alert("No se pudo actualizar el maestro");
          }
        );
      }
    });
  }

  //Funciones para password
  showPassword() {
    if (this.inputType_1 == 'password') {
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else {
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  showPwdConfirmar() {
    if (this.inputType_2 == 'password') {
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else {
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }



  // Funciones para los checkbox
  public checkboxChange(event: any) {
    console.log("Evento: ", event);
    if (event.checked) {
      this.maestro.materias_json.push(event.source.value)
    } else {
      console.log(event.source.value);
      this.maestro.materias_json.forEach((materia, i) => {
        if (materia == event.source.value) {
          this.maestro.materias_json.splice(i, 1)
        }
      });
    }
    console.log("Array materias: ", this.maestro);
  }

  public revisarSeleccion(nombre: string) {
    if (this.maestro.materias_json) {
      var busqueda = this.maestro.materias_json.find((element) => element == nombre);
      if (busqueda != undefined) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

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

  public onInputLetras(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/[^a-zA-ZñÑáéíóúÁÉÍÓÚ\s]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.maestro[field] = sanitized;
    }
  }

  public onInputNumeros(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/[^0-9]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.maestro[field] = sanitized;
    }
  }

  public onInputNoEspacios(event: any, field: string) {
    const input = event.target;
    const value = input.value;
    const sanitized = value.replace(/\s/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.maestro[field] = sanitized;
    }
  }

  public onInputEmail(event: any) {
    const input = event.target;
    const value = input.value;
    // Permitir solo caracteres válidos para email (letras, números, @, ., -, _)
    const sanitized = value.replace(/[^a-zA-Z0-9@._-]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.maestro.email = sanitized;
    }
  }

  public onInputRFC(event: any) {
    const input = event.target;
    const value = input.value;
    // Permitir solo letras y números y truncar a 13 caracteres
    const sanitized = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 13);
    input.value = sanitized;
    this.maestro.rfc = sanitized;
  }

  public onInputCubiculo(event: any) {
    const input = event.target;
    const value = input.value;
    // Permitir letras, números y espacios
    const sanitized = value.replace(/[^a-zA-Z0-9ÑñáéíóúÁÉÍÓÚ ]/g, '');
    if (value !== sanitized) {
      input.value = sanitized;
      this.maestro.cubiculo = sanitized;
    }
  }

  //Función para detectar el cambio de fecha
  public changeFecha(event: any) {
    console.log(event);
    console.log(event.value.toISOString());

    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.maestro.fecha_nacimiento);

    // Calcular edad (aunque maestro no tiene campo edad explícito en el form, es buena práctica tenerlo o si se agrega después)
    // En este caso, solo validamos la fecha
  }
}

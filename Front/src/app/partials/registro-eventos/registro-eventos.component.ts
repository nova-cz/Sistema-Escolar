import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FacadeService } from 'src/app/services/facade.service';
import { EventosService } from 'src/app/services/eventos.service';
import { EditarUserModalComponent } from 'src/app/modals/editar-user-modal/editar-user-modal.component';

@Component({
  selector: 'app-registro-eventos',
  templateUrl: './registro-eventos.component.html',
  styleUrls: ['./registro-eventos.component.scss']
})
export class RegistroEventosComponent implements OnInit {
  @Input() rol: string = '';
  @Input() datos_user: any = {};

  eventoForm!: FormGroup;
  editar: boolean = false;
  responsables: any[] = []; // Lista de maestros y administradores
  idEvento: number = 0; // ID del evento en modo edición
  minDate: Date = new Date(); // Fecha mínima (hoy)

  // Tema personalizado azul para el timepicker
  customTheme = {
    container: {
      bodyBackgroundColor: '#fff',
      buttonColor: '#1976d2'
    },
    dial: {
      dialBackgroundColor: '#1976d2',
      dialActiveColor: '#fff',
      dialInactiveColor: 'rgba(255, 255, 255, 0.5)'
    },
    clockFace: {
      clockFaceBackgroundColor: '#f0f0f0',
      clockHandColor: '#1976d2',
      clockFaceTimeInactiveColor: '#6c6c6c'
    }
  };

  // Opciones para los selects
  tiposEvento = [
    { value: 'conferencia', label: 'Conferencia' },
    { value: 'taller', label: 'Taller' },
    { value: 'seminario', label: 'Seminario' },
    { value: 'concurso', label: 'Concurso' }
  ];

  publicosObjetivo = [
    { value: 'estudiantes', label: 'Estudiantes' },
    { value: 'profesores', label: 'Profesores' },
    { value: 'publico_general', label: 'Público General' }
  ];

  programasEducativos = [
    { value: 'ingenieria_ciencias_computacion', label: 'Ingeniería en Ciencias de la Computación' },
    { value: 'licenciatura_ciencias_computacion', label: 'Licenciatura en Ciencias de la Computación' },
    { value: 'ingenieria_tecnologias_informacion', label: 'Ingeniería en Tecnologías de la Información' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    public facadeService: FacadeService,
    private eventosService: EventosService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Verificar que solo administradores pueden acceder
    if (this.facadeService.getUserGroup() !== 'administrador') {
      alert('No tienes permisos para registrar eventos académicos');
      this.router.navigate(['/home']);
      return;
    }

    this.inicializarFormulario();
    this.cargarResponsables();

    // Si hay datos del evento con ID (edición), cargarlos
    if (this.datos_user && this.datos_user.id) {
      this.editar = true;
      this.idEvento = this.datos_user.id;
      this.cargarDatosEvento(this.datos_user);
    } else {
      this.editar = false;
    }
  }

  inicializarFormulario(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.eventoForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      tipo: ['', Validators.required],
      fecha: ['', [
        Validators.required,
        this.fechaFuturaValidator
      ]],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      lugar: ['', [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
      ]],
      publico_objetivo: ['', Validators.required],
      programa_educativo: [''],
      responsable_id: [null],
      descripcion: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(300),
        Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:\-¿?¡!()]+$/)
      ]],
      cupo_maximo: ['', [
        Validators.required,
        Validators.min(1),
        Validators.max(999)
      ]]
    }, { validators: this.horaFinMayorQueInicioValidator });

    // Listener para mostrar/ocultar programa educativo
    this.eventoForm.get('publico_objetivo')?.valueChanges.subscribe(valor => {
      const programaControl = this.eventoForm.get('programa_educativo');

      if (valor === 'estudiantes') {
        programaControl?.setValidators([Validators.required]);
      } else {
        programaControl?.clearValidators();
        programaControl?.setValue('');
      }
      programaControl?.updateValueAndValidity();
    });
  }

  // Validador personalizado: fecha futura
  fechaFuturaValidator(control: any) {
    if (!control.value) return null;

    const fechaSeleccionada = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fechaSeleccionada >= hoy ? null : { fechaPasada: true };
  }

  // Validador personalizado: hora_fin debe ser mayor que hora_inicio
  horaFinMayorQueInicioValidator(form: AbstractControl): ValidationErrors | null {
    const horaInicio = form.get('hora_inicio')?.value;
    const horaFin = form.get('hora_fin')?.value;

    if (horaInicio && horaFin) {
      // Convertir a formato comparable
      const convertirAMinutos = (hora: string): number => {
        // Manejar formato 12h (PM/AM)
        if (hora.includes('PM') || hora.includes('AM')) {
          const [time, periodo] = hora.split(' ');
          let [h, m] = time.split(':').map(Number);

          if (periodo === 'PM' && h !== 12) h += 12;
          if (periodo === 'AM' && h === 12) h = 0;

          return h * 60 + m;
        }

        // Formato 24h
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };

      const minutosInicio = convertirAMinutos(horaInicio);
      const minutosFin = convertirAMinutos(horaFin);

      if (minutosFin <= minutosInicio) {
        return { horaFinInvalida: true };
      }
    }
    return null;
  }

  // Getter para acceder fácilmente a los controles
  get f() {
    return this.eventoForm.controls;
  }

  // Mostrar errores específicos
  getErrorMessage(campo: string): string {
    const control = this.eventoForm.get(campo);

    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Este campo es requerido';
    if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `El valor mínimo es ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `El valor máximo es ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) {
      if (campo === 'nombre') return 'Solo se permiten letras, números y espacios';
      if (campo === 'lugar') return 'Solo se permiten letras, números y espacios';
      if (campo === 'descripcion') return 'Solo se permiten letras, números y signos de puntuación básicos';
      return 'Formato inválido (HH:MM)';
    }
    if (control.errors['fechaPasada']) return 'La fecha debe ser futura';

    return 'Campo inválido';
  }

  mostrarProgramaEducativo(): boolean {
    return this.eventoForm.get('publico_objetivo')?.value === 'estudiantes';
  }

  // Sanitizar Nombre - alfanumérico y espacios (igual que Lugar)
  sanitizeNombre(event: any): void {
    const input = event.target;
    const sanitized = input.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
      this.eventoForm.get('nombre')?.setValue(sanitized);
    }
  }

  // Sanitizar Lugar - solo alfanumérico y espacios
  sanitizeLugar(event: any): void {
    const input = event.target;
    const sanitized = input.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
      this.eventoForm.get('lugar')?.setValue(sanitized);
    }
  }

  // Sanitizar Descripción - alfanumérico + puntuación básica
  sanitizeDescripcion(event: any): void {
    const input = event.target;
    const sanitized = input.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,;:\-¿?¡!()]/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
      this.eventoForm.get('descripcion')?.setValue(sanitized);
    }
  }

  // Limitar Cupo a 3 dígitos
  sanitizeCupo(event: any): void {
    const input = event.target;
    let value = input.value.replace(/[^0-9]/g, ''); // Solo números

    if (value.length > 3) {
      value = value.slice(0, 3); // Máximo 3 dígitos
    }

    if (input.value !== value) {
      input.value = value;
      this.eventoForm.get('cupo_maximo')?.setValue(value ? parseInt(value) : null);
    }
  }

  cargarResponsables(): void {
    this.eventosService.obtenerResponsables().subscribe(
      (response) => {
        this.responsables = response;
      },
      (error) => {
        console.error('Error al cargar responsables:', error);
      }
    );
  }

  cargarDatosEvento(datos: any): void {
    // Convertir las horas del formato del backend al formato del timepicker
    const horaInicioFormateada = this.convertirHoraParaTimepicker(datos.hora_inicio);
    const horaFinFormateada = this.convertirHoraParaTimepicker(datos.hora_fin);

    this.eventoForm.patchValue({
      nombre: datos.nombre,
      tipo: datos.tipo,
      fecha: datos.fecha,
      hora_inicio: horaInicioFormateada,
      hora_fin: horaFinFormateada,
      lugar: datos.lugar,
      publico_objetivo: datos.publico_objetivo,
      programa_educativo: datos.programa_educativo,
      responsable_id: datos.responsable?.id || null,
      descripcion: datos.descripcion,
      cupo_maximo: datos.cupo_maximo
    });
  }

  // Convertir hora del backend (formato 24h como "16:00:00" o "16:00") al formato del timepicker
  convertirHoraParaTimepicker(hora: string): string {
    if (!hora) return '';

    // Extraer horas y minutos (el backend puede enviar "HH:MM:SS" o "HH:MM")
    const partes = hora.split(':');
    let horas = parseInt(partes[0], 10);
    const minutos = partes[1];

    // Convertir a formato 12 horas con AM/PM
    const periodo = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12; // Convertir 0 a 12 para medianoche, 13-23 a 1-11

    return `${horas}:${minutos} ${periodo}`;
  }

  // Convertir formato de 12h a 24h para el backend
  convertirA24Horas(hora: string): string {
    if (!hora) return '';

    // Si ya está en formato 24h, retornar tal cual
    if (!hora.includes('PM') && !hora.includes('AM')) {
      return hora;
    }

    const [time, periodo] = hora.split(' ');
    let [h, m] = time.split(':').map(Number);

    if (periodo === 'PM' && h !== 12) h += 12;
    if (periodo === 'AM' && h === 12) h = 0;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Convertir fecha a formato YYYY-MM-DD
  convertirFecha(fecha: any): string {
    if (!fecha) return '';

    const date = new Date(fecha);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  registrar(): void {
    // Marcar todos los campos como tocados para mostrar errores
    Object.keys(this.eventoForm.controls).forEach(key => {
      this.eventoForm.get(key)?.markAsTouched();
    });

    if (this.eventoForm.invalid) {
      alert('Por favor, corrige los errores en el formulario');
      return;
    }

    // Validación adicional: hora fin > hora inicio
    if (this.eventoForm.errors?.['horaFinInvalida']) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    const datosEvento = {
      ...this.eventoForm.value,
      fecha: this.convertirFecha(this.eventoForm.value.fecha),
      hora_inicio: this.convertirA24Horas(this.eventoForm.value.hora_inicio),
      hora_fin: this.convertirA24Horas(this.eventoForm.value.hora_fin)
    };
    console.log('Evento a registrar:', datosEvento);

    // Llamada al servicio para registrar el evento
    this.eventosService.registrarEvento(datosEvento).subscribe(
      (response) => {
        console.log('Evento registrado:', response);
        alert('Evento registrado exitosamente');
        this.eventoForm.reset();
        this.editar = false;
        // Redirigir al home
        this.router.navigate(['/home']);
      },
      (error) => {
        console.error('Error al registrar evento:', error);
        alert('Error al registrar el evento. Por favor, intenta de nuevo.');
      }
    );
  }

  actualizar(): void {
    // Marcar todos los campos como tocados
    Object.keys(this.eventoForm.controls).forEach(key => {
      this.eventoForm.get(key)?.markAsTouched();
    });

    if (this.eventoForm.invalid) {
      alert('Por favor, corrige los errores en el formulario');
      return;
    }

    // Validación adicional: hora fin > hora inicio
    if (this.eventoForm.errors?.['horaFinInvalida']) {
      alert('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Mostrar modal de confirmación
    const dialogRef = this.dialog.open(EditarUserModalComponent, {
      data: {
        tipo: 'evento',
        nombre: this.eventoForm.value.nombre
      },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        // Si el usuario confirma, proceder con la actualización
        const datosEvento = {
          ...this.eventoForm.value,
          id: this.idEvento,
          fecha: this.convertirFecha(this.eventoForm.value.fecha),
          hora_inicio: this.convertirA24Horas(this.eventoForm.value.hora_inicio),
          hora_fin: this.convertirA24Horas(this.eventoForm.value.hora_fin)
        };
        console.log('Evento a actualizar:', datosEvento);

        // Llamada al servicio para actualizar el evento
        this.eventosService.actualizarEvento(datosEvento).subscribe(
          (response) => {
            console.log('Evento actualizado:', response);
            alert('Evento actualizado exitosamente');
            // Redirigir a la lista de eventos
            this.router.navigate(['/eventos-academicos']);
          },
          (error) => {
            console.error('Error al actualizar evento:', error);
            alert('Error al actualizar el evento. Por favor, intenta de nuevo.');
          }
        );
      }
    });
  }
}

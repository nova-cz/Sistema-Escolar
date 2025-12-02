import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { EventosService } from 'src/app/services/eventos.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';

@Component({
  selector: 'app-eventos-screen',
  templateUrl: './eventos-screen.component.html',
  styleUrls: ['./eventos-screen.component.scss']
})
export class EventosScreenComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_eventos: any[] = [];
  public isAdmin: boolean = false;

  // Para la tabla
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<DatosEvento>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private facadeService: FacadeService,
    private eventosService: EventosService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.isAdmin = this.rol === 'administrador';

    // Configurar columnas según el rol
    if (this.isAdmin) {
      // Administrador ve todas las columnas + botones
      this.displayedColumns = [
        'id', 'nombre', 'tipo', 'fecha', 'horario',
        'lugar', 'publico_objetivo', 'responsable',
        'cupo_maximo', 'editar', 'eliminar'
      ];
    } else {
      // Maestro y estudiante solo ven la info (sin botones)
      this.displayedColumns = [
        'id', 'nombre', 'tipo', 'fecha', 'horario',
        'lugar', 'publico_objetivo', 'responsable',
        'cupo_maximo'
      ];
    }

    // Validar que haya inicio de sesión
    this.token = this.facadeService.getSessionToken();
    if (this.token == "") {
      this.router.navigate(["/"]);
    }

    // Obtener eventos (el backend ya filtra por rol)
    this.obtenerEventos();
  }

  ngAfterViewInit() {
    // Conecta el paginador Y el sort al dataSource
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Consumimos el servicio para obtener los eventos
  public obtenerEventos() {
    this.eventosService.obtenerListaEventos().subscribe(
      (response) => {
        // Filtrar eventos según el rol del usuario
        let eventosFiltrados = response;

        if (this.rol === 'maestro') {
          // Maestros solo ven eventos para profesores y público general
          eventosFiltrados = response.filter((evento: any) =>
            evento.publico_objetivo === 'profesores' ||
            evento.publico_objetivo === 'publico_general'
          );
        } else if (this.rol === 'alumno') {
          // Alumnos solo ven eventos para estudiantes y público general
          eventosFiltrados = response.filter((evento: any) =>
            evento.publico_objetivo === 'estudiantes' ||
            evento.publico_objetivo === 'publico_general'
          );
        }
        // Administradores ven todos los eventos (sin filtro)

        this.lista_eventos = eventosFiltrados;

        if (this.lista_eventos.length > 0) {
          // Formatear datos para la tabla
          this.lista_eventos.forEach(evento => {
            // Formatear el horario para mostrar
            evento.horario_display = `${evento.hora_inicio} - ${evento.hora_fin}`;

            // Nombre del responsable
            if (evento.responsable) {
              evento.responsable_nombre = `${evento.responsable.first_name} ${evento.responsable.last_name}`;
            } else {
              evento.responsable_nombre = 'Sin asignar';
            }

            // Formatear público objetivo
            evento.publico_display = this.formatearPublico(evento.publico_objetivo);

            // Formatear tipo
            evento.tipo_display = this.formatearTipo(evento.tipo);
          });

          // Configuración del sort
          this.dataSource.sortingDataAccessor = (item: DatosEvento, property: string) => {
            switch (property) {
              case 'nombre':
                return item.nombre.toLowerCase();
              case 'tipo':
                return item.tipo.toLowerCase();
              case 'fecha':
                return new Date(item.fecha).getTime();
              case 'lugar':
                return item.lugar.toLowerCase();
              case 'publico_objetivo':
                return item.publico_objetivo.toLowerCase();
              case 'responsable':
                return item.responsable_nombre.toLowerCase();
              case 'cupo_maximo':
                return Number(item.cupo_maximo);
              default: {
                const value = item[property as keyof DatosEvento];
                return typeof value === 'string' ? value.toLowerCase() : value;
              }
            }
          };

          // Configuración del filtro
          this.dataSource.filterPredicate = (data: DatosEvento, filter: string) => {
            const dataStr = (
              data.nombre +
              data.tipo +
              data.lugar +
              data.publico_objetivo +
              data.responsable_nombre +
              data.descripcion
            ).toLowerCase();
            return dataStr.includes(filter.trim());
          };

          this.dataSource.data = this.lista_eventos as DatosEvento[];

          // Paginador
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
            if (this.sort) {
              this.dataSource.sort = this.sort;
            }
          }, 0);
        }
      }, (error) => {
        console.error("Error al obtener la lista de eventos: ", error);
        alert("No se pudo obtener la lista de eventos");
      }
    );
  }

  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public editarEvento(evento: any) {
    // Navegar al registro-usuarios con el ID del evento en la URL
    this.router.navigate(['/registro-usuarios/evento/' + evento.id]);
  }

  public eliminarEvento(evento: any) {
    const dialogRef = this.dialog.open(EliminarUserModalComponent, {
      data: {
        id: evento.id,
        nombre: evento.nombre,
        rol: 'evento'
      },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isDelete) {
        this.eventosService.eliminarEvento(evento.id).subscribe(
          () => {
            console.log("Evento eliminado");
            alert("Evento eliminado correctamente.");
            // Recargar la lista
            this.obtenerEventos();
          },
          (error) => {
            console.error("Error al eliminar evento:", error);
            alert("No se pudo eliminar el evento.");
          }
        );
      }
    });
  }

  // Formatear el público objetivo
  formatearPublico(publico: string): string {
    const formatos: any = {
      'estudiantes': 'Estudiantes',
      'profesores': 'Profesores',
      'publico_general': 'Público General',
      'maestros': 'Profesores'
    };
    return formatos[publico] || publico;
  }

  // Formatear el tipo de evento
  formatearTipo(tipo: string): string {
    const formatos: any = {
      'conferencia': 'Conferencia',
      'seminario': 'Seminario',
      'taller': 'Taller',
      'curso': 'Curso',
      'congreso': 'Congreso',
      'simposio': 'Simposio',
      'otro': 'Otro'
    };
    return formatos[tipo] || tipo;
  }
}

export interface DatosEvento {
  id: number;
  nombre: string;
  tipo: string;
  tipo_display: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  horario_display: string;
  lugar: string;
  publico_objetivo: string;
  publico_display: string;
  programa_educativo: string | null;
  responsable: any;
  responsable_nombre: string;
  descripcion: string;
  cupo_maximo: number;
}

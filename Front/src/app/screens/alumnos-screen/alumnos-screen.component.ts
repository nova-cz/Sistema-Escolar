import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';

@Component({
  selector: 'app-alumnos-screen',
  templateUrl: './alumnos-screen.component.html',
  styleUrls: ['./alumnos-screen.component.scss']
})
export class AlumnosScreenComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_alumnos: any[] = [];
  public isAdmin: boolean = false;

  // Para la tabla
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<DatosAlumno>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private facadeService: FacadeService,
    private alumnosService: AlumnosService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.isAdmin = this.rol === 'administrador';

    // Configurar columnas según el rol
    // Tanto administradores como maestros pueden editar y eliminar alumnos
    if (this.isAdmin || this.rol === 'maestro') {
      this.displayedColumns = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'edad', 'telefono', 'curp', 'rfc', 'ocupacion', 'editar', 'eliminar'];
    } else {
      this.displayedColumns = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'edad', 'telefono', 'curp', 'rfc', 'ocupacion'];
    }

    this.token = this.facadeService.getSessionToken();
    if (this.token == "") {
      this.router.navigate(["/"]);
    }

    this.obtenerAlumnos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Obtener lista de alumnos
  public obtenerAlumnos() {
    this.alumnosService.obtenerListaAlumnos().subscribe(
      (response) => {
        this.lista_alumnos = response;
        console.log("Lista alumnos: ", this.lista_alumnos);

        if (this.lista_alumnos.length > 0) {
          // Agregar datos del nombre y email
          this.lista_alumnos.forEach(alumno => {
            alumno.first_name = alumno.user.first_name;
            alumno.last_name = alumno.user.last_name;
            alumno.email = alumno.user.email;
          });
          console.log("Alumnos procesados: ", this.lista_alumnos);

          // aplica sort
          this.dataSource.sortingDataAccessor = (item: DatosAlumno, property: string) => {
            switch (property) {
              case 'nombre':
                return `${item.first_name} ${item.last_name}`.toLowerCase();
              case 'matricula':
                return String(item.matricula);
              case 'edad':
                return Number(item.edad);
              case 'fecha_nacimiento':
                return new Date(item.fecha_nacimiento).getTime();
              case 'telefono':
                return String(item.telefono);
              default: {
                const value = item[property as keyof DatosAlumno];
                return typeof value === 'string' ? value.toLowerCase() : value;
              }
            }
          };

          // iltro
          this.dataSource.filterPredicate = (data: DatosAlumno, filter: string) => {
            const dataStr = (
              data.matricula +
              data.first_name +
              data.last_name +
              data.email +
              data.curp +
              data.rfc +
              data.ocupacion +
              data.telefono
            ).toLowerCase();
            return dataStr.includes(filter.trim());
          };

          // Asignar datos
          this.dataSource.data = this.lista_alumnos as DatosAlumno[];

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
        console.error("Error al obtener la lista de alumnos: ", error);
        alert("No se pudo obtener la lista de alumnos");
      }
    );
  }

  // Filtro
  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/alumno/" + idUser]);
  }

  public delete(idUser: number) {
    const dialogRef = this.dialog.open(EliminarUserModalComponent, {
      data: { id: idUser, rol: 'alumno' },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.isDelete) {
        console.log("Alumno eliminado");
        alert("Alumno eliminado correctamente.");
        //Recargar la lista
        this.obtenerAlumnos();
      } else {
        alert("El alumno no se ha podido eliminar.");
        console.log("No se eliminó el alumno");
      }
    });
  }

}

// Interface para los datos de alumno
export interface DatosAlumno {
  id: number;
  matricula: string;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string;
  edad: number;
  telefono: string;
  curp: string;
  rfc: string;
  ocupacion: string;
}

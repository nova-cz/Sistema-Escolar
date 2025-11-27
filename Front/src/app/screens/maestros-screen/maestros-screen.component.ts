import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';


@Component({
  selector: 'app-maestros-screen',
  templateUrl: './maestros-screen.component.html',
  styleUrls: ['./maestros-screen.component.scss']
})
export class MaestrosScreenComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_maestros: any[] = [];
  public isAdmin: boolean = false;
  public currentUserId: string = "";  // ID del usuario actual

  //Para la tabla
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<DatosUsuario>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private facadeService: FacadeService,
    private maestrosService: MaestrosService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.isAdmin = this.rol === 'administrador';
    this.currentUserId = this.facadeService.getUserId();

    // Configurar columnas según el rol
    if (this.isAdmin) {
      this.displayedColumns = ['id_trabajador', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'cubiculo', 'area_investigacion', 'editar', 'eliminar'];
    } else {
      this.displayedColumns = ['id_trabajador', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'cubiculo', 'area_investigacion', 'editar'];
    }

    //Validar que haya inicio de sesión
    this.token = this.facadeService.getSessionToken();
    if (this.token == "") {
      this.router.navigate(["/"]);
    }

    //Obtener maestros
    this.obtenerMaestros();
  }

  ngAfterViewInit() {
    // Conecta el paginador Y el sort al dataSource
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // Consumimos el servicio para obtener los maestros
  public obtenerMaestros() {
    this.maestrosService.obtenerListaMaestros().subscribe(
      (response) => {
        this.lista_maestros = response;

        if (this.lista_maestros.length > 0) {
          this.lista_maestros.forEach(usuario => {
            usuario.first_name = usuario.user.first_name;
            usuario.last_name = usuario.user.last_name;
            usuario.email = usuario.user.email;
          });

          // Config del sort
          this.dataSource.sortingDataAccessor = (item: DatosUsuario, property: string) => {
            switch (property) {
              case 'nombre':
                return `${item.first_name} ${item.last_name} `.toLowerCase();
              case 'id_trabajador':
                return Number(item.id_trabajador);
              case 'area_investigacion':
                // se ordena numéricamente; si es string, alfabéticamente
                return typeof item.area_investigacion === 'number'
                  ? item.area_investigacion
                  : String(item.area_investigacion).toLowerCase();
              case 'cubiculo':
                const cubiculo = String(item.cubiculo);
                const match = cubiculo.match(/^([A-Za-z]+)-?(\d+)$/);
                if (match) {
                  return match[1].toLowerCase() + match[2].padStart(10, '0');
                }
                return cubiculo.toLowerCase();
              case 'fecha_nacimiento':
                return new Date(item.fecha_nacimiento).getTime();
              case 'telefono':
                return String(item.telefono);
              default: {
                const value = item[property as keyof DatosUsuario];
                return typeof value === 'string' ? value.toLowerCase() : value;
              }
            }
          };

          // iltro
          this.dataSource.filterPredicate = (data: DatosUsuario, filter: string) => {
            const dataStr = (
              data.id_trabajador +
              data.first_name +
              data.last_name +
              data.email +
              data.rfc +
              data.cubiculo +
              data.area_investigacion
            ).toLowerCase();
            return dataStr.includes(filter.trim());
          };

          this.dataSource.data = this.lista_maestros as DatosUsuario[];

          //Paginador
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
        console.error("Error al obtener la lista de maestros: ", error);
        alert("No se pudo obtener la lista de maestros");
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

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/maestro/" + idUser]);
  }

  // Verificar si el usuario actual puede editar al maestro
  public canEditMaestro(maestro: any): boolean {
    // Los administradores pueden editar a todos
    if (this.isAdmin) {
      return true;
    }
    // Los maestros solo pueden editar su propio perfil
    // Comparar el ID del usuario logueado con el ID del user del maestro
    return maestro.user && maestro.user.id &&
      this.currentUserId &&
      maestro.user.id.toString() === this.currentUserId.toString();
  }

  public delete(idUser: number) {
    const dialogRef = this.dialog.open(EliminarUserModalComponent, {
      data: { id: idUser, rol: 'maestro' },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.isDelete) {
        console.log("Maestro eliminado");
        alert("Maestro eliminado correctamente.");
        //Recargar la lista
        this.obtenerMaestros();
      } else {
        alert("El maestro no se ha podido eliminar.");
        console.log("No se eliminó el maestro");
      }
    });
  }

}

export interface DatosUsuario {
  id: number,
  id_trabajador: number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string,
  telefono: string,
  rfc: string,
  cubiculo: string,
  area_investigacion: number,
}
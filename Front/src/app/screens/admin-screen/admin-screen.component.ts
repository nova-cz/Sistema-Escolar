import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { FacadeService } from 'src/app/services/facade.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';

@Component({
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.scss']
})
export class AdminScreenComponent implements OnInit {
  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_admins: any[] = [];
  public isAdmin: boolean = false;

  // Para la tabla - columnas dinámicas según rol
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public facadeService: FacadeService,
    private administradoresService: AdministradoresService,
    private router: Router,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.isAdmin = this.rol === 'administrador';

    // Configurar columnas según el rol
    if (this.isAdmin) {
      this.displayedColumns = ['id', 'clave_admin', 'nombre', 'email', 'rfc', 'ocupacion', 'editar', 'eliminar'];
    } else {
      this.displayedColumns = ['id', 'clave_admin', 'nombre', 'email', 'rfc', 'ocupacion', 'editar'];
    }

    this.obtenerAdmins();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  public obtenerAdmins() {
    this.administradoresService.obtenerListaAdmins().subscribe(
      (response) => {
        this.lista_admins = response;
        console.log("Lista users: ", this.lista_admins);

        if (this.lista_admins.length > 0) {
          // Agregar propiedades planas para facilitar el ordenamiento si es necesario, 
          // aunque sortingDataAccessor lo maneja.

          this.dataSource.data = this.lista_admins;

          // Configurar sortingDataAccessor para propiedades anidadas
          this.dataSource.sortingDataAccessor = (item: any, property: string) => {
            switch (property) {
              case 'nombre':
                return (item.user.first_name + ' ' + item.user.last_name).toLowerCase();
              case 'email':
                return item.user.email.toLowerCase();
              case 'id':
                return Number(item.id);
              case 'clave_admin':
              case 'rfc':
              case 'ocupacion':
                return item[property] ? item[property].toLowerCase() : '';
              default:
                return item[property];
            }
          };

          // Configurar filterPredicate
          this.dataSource.filterPredicate = (data: any, filter: string) => {
            const dataStr = (
              data.id +
              data.clave_admin +
              data.user.first_name +
              data.user.last_name +
              data.user.email +
              data.rfc +
              data.ocupacion
            ).toLowerCase();
            return dataStr.includes(filter.trim());
          };

          // Reinicializar paginator y sort si es necesario (a veces ayuda con la carga asíncrona)
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
        alert("No se pudo obtener la lista de administradores");
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
    this.router.navigate(["registro-usuarios/administrador/" + idUser]);
  }

  public delete(idUser: number) {
    const dialogRef = this.dialog.open(EliminarUserModalComponent, {
      data: { id: idUser, rol: 'administrador' },
      height: '288px',
      width: '328px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.isDelete) {
        console.log("Administrador eliminado");
        alert("Administrador eliminado correctamente.");
        this.obtenerAdmins();
      } else {
        alert("El administrador no se ha podido eliminar.");
        console.log("No se eliminó el administrador");
      }
    });
  }
}

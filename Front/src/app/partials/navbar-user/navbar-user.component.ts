import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';

@Component({
  selector: 'app-navbar-user',
  templateUrl: './navbar-user.component.html',
  styleUrls: ['./navbar-user.component.scss']
})
export class NavbarUserComponent implements OnInit {

  public expandedMenu: string | null = null;
  public userInitial: string = '';
  public isMobileView: boolean = window.innerWidth <= 992;
  public showUserMenu: boolean = false;
  public mobileOpen: boolean = false;
  public userRole: string = '';
  public registroMenuOpen: boolean = false;

  // Estas variables se utilizarán por si se habilita el tema oscuro
  paletteMode: 'light' | 'dark' = 'light';
  colorPalettes = {
    light: {
      '--background-main': '#f4f7fb',
      '--sidebar-bg': '#23395d',
      '--navbar-bg': '#fff',
      '--text-main': '#222',
      '--table-bg': '#fff',
      '--table-header-bg': '#cfe2ff',
    },
    dark: {
      '--background-main': '#181a1b',
      '--sidebar-bg': '#1a2636',
      '--navbar-bg': '#222',
      '--text-main': '#e4ecfa',
      '--table-bg': '#222',
      '--table-header-bg': '#30507a',
    }
  };

  constructor(private router: Router, private facadeService: FacadeService) {
    // Obtenemos el rol del usuario y la inicial del nombre
    const name = this.facadeService.getUserCompleteName();
    if (name && name.length > 0) {
      this.userInitial = name.trim()[0].toUpperCase();
    } else {
      this.userInitial = '?';
    }
    this.userRole = this.facadeService.getUserGroup();

    // Siempre inicia con la paleta blanca
    this.paletteMode = 'light';
    const palette = this.colorPalettes['light'];
    Object.keys(palette).forEach(key => {
      document.documentElement.style.setProperty(key, palette[key]);
    });
  }

  ngOnInit(): void {
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth <= 992;
    if (!this.isMobileView) {
      this.mobileOpen = false;
      this.registroMenuOpen = false;
    }
  }

  // Cerrar dropdown al hacer click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.registro-menu-item');

    if (!clickedInside && this.registroMenuOpen) {
      this.registroMenuOpen = false;
    }
  }

  toggleSidebar() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeSidebar() {
    this.mobileOpen = false;
    this.registroMenuOpen = false;
  }

  togglePalette() {
    this.paletteMode = this.paletteMode === 'light' ? 'dark' : 'light';
    const palette = this.colorPalettes[this.paletteMode];
    Object.keys(palette).forEach(key => {
      document.documentElement.style.setProperty(key, palette[key]);
    });
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  editUser() {
    const userId = this.facadeService.getUserId();
    const userRole = this.facadeService.getUserGroup();
    this.router.navigate([`/registro-usuarios/${userRole}/${userId}`]);
    this.showUserMenu = false;
  }

  toggleMenu(menu: string) {
    this.expandedMenu = this.expandedMenu === menu ? null : menu;
  }

  closeMenu() {
    this.expandedMenu = null;
  }

  logout() {
    this.facadeService.logout().subscribe(
      (response) => {
        this.facadeService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      },
      (error) => {
        console.error(error);
        this.facadeService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      }
    );
  }

  // Role helpers
  isAdmin(): boolean {
    return this.userRole === 'administrador';
  }
  isTeacher(): boolean {
    return this.userRole === 'maestro';
  }
  isStudent(): boolean {
    return this.userRole === 'alumno';
  }
  canSeeAdminItems(): boolean {
    return this.isAdmin();
  }
  canSeeTeacherItems(): boolean {
    return this.isAdmin() || this.isTeacher();
  }
  canSeeStudentItems(): boolean {
    return this.isAdmin() || this.isTeacher() || this.isStudent();
  }
  canSeeHomeItem(): boolean {
    return this.isAdmin() || this.isTeacher();
  }
  canSeeRegisterItem(): boolean {
    return this.isAdmin() || this.isTeacher();
  }

  // Specific registration permissions
  canRegisterStudents(): boolean {
    return this.isAdmin() || this.isTeacher();
  }

  canRegisterTeachers(): boolean {
    return this.isAdmin();
  }

  canRegisterAdmins(): boolean {
    return this.isAdmin();
  }

  canRegisterEvents(): boolean {
    return this.isAdmin();
  }

  // Dropdown logic
  toggleRegistroMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.registroMenuOpen = !this.registroMenuOpen;
  }

  navigateToRegistro(tipo: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.registroMenuOpen = false;
    if (this.isMobileView) {
      this.closeSidebar();
    }

    this.router.navigate(['/registro-usuarios'], {
      queryParams: { tipo: tipo }
    });
  }

}

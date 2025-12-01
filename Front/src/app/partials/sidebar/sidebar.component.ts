import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  mobileOpen = false;
  isMobileView = window.innerWidth < 900;
  userRole: string = '';
  registroMenuOpen = false;

  constructor(
    private router: Router,
    private facadeService: FacadeService
  ) { }

  ngOnInit(): void {
    this.userRole = this.facadeService.getUserGroup();
    console.log('User role in sidebar:', this.userRole);
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth < 900;
    if (!this.isMobileView) {
      this.mobileOpen = false;
    }
  }

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

  logout() {
    this.facadeService.logout().subscribe(
      (response) => {
        console.log('Logout successful');
        this.facadeService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      },
      (error) => {
        console.error('Logout error:', error);
        this.facadeService.destroyUser();
        this.router.navigate(['/login']);
        this.closeSidebar();
      }
    );
  }

  // Role checks
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

  // Toggle dropdown menu - SOLO abre/cierra, NO navega
  toggleRegistroMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation(); // CRÍTICO: detiene TODOS los handlers
    this.registroMenuOpen = !this.registroMenuOpen;
    console.log('✅ Dropdown toggled:', this.registroMenuOpen);
    // NO llamar a router.navigate aquí
    return; // Asegura que no se ejecute nada más
  }

  // NUEVO método que SOLO navega cuando seleccionas una opción
  navigateToRegistro(tipo: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    console.log('🚀 Navegando a registro de:', tipo);

    // Cerrar dropdown
    this.registroMenuOpen = false;

    // Cerrar sidebar en mobile
    if (this.isMobileView) {
      this.closeSidebar();
    }

    // Navegar con queryParams
    this.router.navigate(['/registro-usuarios'], {
      queryParams: { tipo: tipo }
    });
  }

  // Navegar a eventos académicos
  navigateToEventos(): void {
    console.log('🎓 Navegando a eventos académicos');

    // Cerrar sidebar en mobile
    if (this.isMobileView) {
      this.closeSidebar();
    }

    this.router.navigate(['/eventos-academicos']);
  }

  // Método legacy - ya no se usa
  closeRegistroMenu(): void {
    this.registroMenuOpen = false;
    if (this.isMobileView) {
      this.closeSidebar();
    }
  }
}
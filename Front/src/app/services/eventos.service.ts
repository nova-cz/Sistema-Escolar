import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FacadeService } from './facade.service';

@Injectable({
    providedIn: 'root'
})
export class EventosService {

    constructor(
        private http: HttpClient,
        private facadeService: FacadeService
    ) { }

    // Headers con autenticación usando facadeService
    private getHeaders(): HttpHeaders {
        const token = this.facadeService.getSessionToken();
        if (token) {
            return new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            });
        }
        return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    /**
     * Obtener todos los eventos (filtrados automáticamente por rol en el backend)
     */
    public obtenerListaEventos(): Observable<any> {
        const headers = this.getHeaders();
        return this.http.get<any>(`${environment.url_api}/lista-eventos/`, { headers });
    }

    /**
     * Obtener evento por ID
     */
    public obtenerEventoPorID(idEvento: number): Observable<any> {
        const headers = this.getHeaders();
        return this.http.get<any>(`${environment.url_api}/eventos/?id=${idEvento}`, { headers });
    }

    /**
     * Registrar nuevo evento académico (solo admin)
     */
    public registrarEvento(datos: any): Observable<any> {
        const headers = this.getHeaders();
        return this.http.post<any>(`${environment.url_api}/eventos/`, datos, { headers });
    }

    /**
     * Actualizar evento existente (solo admin)
     */
    public actualizarEvento(datos: any): Observable<any> {
        const headers = this.getHeaders();
        return this.http.put<any>(`${environment.url_api}/eventos/`, datos, { headers });
    }

    /**
     * Eliminar evento (solo admin)
     */
    public eliminarEvento(idEvento: number): Observable<any> {
        const headers = this.getHeaders();
        return this.http.delete<any>(`${environment.url_api}/eventos/?id=${idEvento}`, { headers });
    }

    /**
     * Obtener lista de responsables (maestros y administradores)
     */
    public obtenerResponsables(): Observable<any> {
        const headers = this.getHeaders();
        return this.http.get<any>(`${environment.url_api}/responsables/`, { headers });
    }

    /**
     * Obtener el total de eventos (para gráficas)
     */
    public getTotalEventos(): Observable<any> {
        const headers = this.getHeaders();
        return this.http.get<any>(`${environment.url_api}/lista-eventos/`, { headers });
    }
}

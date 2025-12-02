import { Component, OnInit } from '@angular/core';
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import { AdministradoresService } from 'src/app/services/administradores.service';

@Component({
  selector: 'app-graficas-screen',
  templateUrl: './graficas-screen.component.html',
  styleUrls: ['./graficas-screen.component.scss']
})
export class GraficasScreenComponent implements OnInit {

  //Agregar chartjs-plugin-datalabels
  //Variables

  public total_user: any = {};

  //Histograma
  lineChartData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        data: [89, 34, 43, 54, 28, 74, 93],
        label: 'Registro de materias',
        backgroundColor: '#F88406'
      }
    ]
  }
  lineChartOption = {
    responsive: false
  }
  lineChartPlugins = [DatalabelsPlugin];

  //Barras
  barChartData = {
    labels: ["Congreso", "FePro", "Presentación Doctoral", "Feria Matemáticas", "T-System"],
    datasets: [
      {
        data: [34, 43, 54, 28, 74],
        label: 'Eventos Académicos',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB',
          '#FB82F5',
          '#2AD84A'
        ]
      }
    ]
  }
  barChartOption = {
    responsive: false
  }
  barChartPlugins = [DatalabelsPlugin];

  //Circular
  pieChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data: [89, 34, 43],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }
    ]
  }
  pieChartOption = {
    responsive: false
  }
  pieChartPlugins = [DatalabelsPlugin];

  // Doughnut
  doughnutChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data: [89, 34, 43],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#31E7E7'
        ]
      }
    ]
  }
  doughnutChartOption = {
    responsive: false
  }
  doughnutChartPlugins = [DatalabelsPlugin];

  constructor(
    private administradoresServices: AdministradoresService
  ) { }

  ngOnInit(): void {
    this.obtenerTotalUsers();
  }

  // Función para obtener el total de usuarios registrados
  public obtenerTotalUsers() {
    // Obtener total de usuarios (para las gráficas de pastel y dona)
    this.administradoresServices.getTotalUsuarios().subscribe(
      (response) => {
        this.total_user = response;
        console.log("Total usuarios: ", this.total_user);

        const dataUsers = [this.total_user.admins, this.total_user.maestros, this.total_user.alumnos];
        const labelsUsers = ["Administradores", "Maestros", "Alumnos"];

        // Circular
        this.pieChartData = {
          labels: labelsUsers,
          datasets: [{
            data: dataUsers,
            label: 'Registro de usuarios',
            backgroundColor: ['#FCFF44', '#F1C8F2', '#31E731']
          }]
        };

        // Dona
        this.doughnutChartData = {
          labels: labelsUsers,
          datasets: [{
            data: dataUsers,
            label: 'Registro de usuarios',
            backgroundColor: ['#F88406', '#FCFF44', '#31E7E7']
          }]
        };

      }, (error) => {
        console.log("Error al obtener total de usuarios ", error);
        alert("No se pudo obtener el total de cada rol de usuarios");
      }
    );

    // Obtener total de eventos (para las gráficas de línea y barras)
    this.administradoresServices.getTotalEventos().subscribe(
      (response) => {
        console.log("Total eventos: ", response);
        const dataEventos = [response.estudiantes, response.profesores, response.publico_general];
        const labelsEventos = ["Estudiantes", "Profesores", "Público General"];

        // Histograma (Line Chart) - Eventos
        this.lineChartData = {
          labels: labelsEventos,
          datasets: [{
            data: dataEventos,
            label: 'Eventos por Público Objetivo',
            backgroundColor: '#F88406'
          }]
        };

        // Barras - Eventos
        this.barChartData = {
          labels: labelsEventos,
          datasets: [{
            data: dataEventos,
            label: 'Eventos por Público Objetivo',
            backgroundColor: ['#F88406', '#FCFF44', '#82D3FB']
          }]
        };
      },
      (error) => {
        console.log("Error al obtener total de eventos ", error);
        alert("No se pudo obtener el total de eventos");
      }
    );
  }

}

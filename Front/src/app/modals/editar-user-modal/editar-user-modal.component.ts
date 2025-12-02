import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-editar-user-modal',
    templateUrl: './editar-user-modal.component.html',
    styleUrls: ['./editar-user-modal.component.scss']
})
export class EditarUserModalComponent implements OnInit {

    public tipo: string = "";
    public nombre: string = "";

    constructor(
        private dialogRef: MatDialogRef<EditarUserModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit(): void {
        this.tipo = this.data.tipo || 'usuario';
        this.nombre = this.data.nombre || '';
    }

    public cerrar_modal() {
        this.dialogRef.close({ isEdit: false });
    }

    public confirmarEdicion() {
        this.dialogRef.close({ isEdit: true });
    }

}

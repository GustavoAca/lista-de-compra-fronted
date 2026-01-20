// src/app/features/compra/components/compra-item/compra-item.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms'; // Import FormControl
import { ItemCompra } from '@app/features/compra/models/item-compra.model';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip'; // Added MatTooltipModule

@Component({
  selector: 'app-compra-item',
  templateUrl: './compra-item.component.html',
  styleUrls: ['./compra-item.component.scss'],
  standalone: true, // Mark as standalone
  imports: [
    // Add imports for standalone component
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule // Added
  ],
})
export class CompraItemComponent implements OnInit {
  @Input() itemForm!: FormGroup; // FormGroup para o item
  @Input() itemOriginal!: ItemCompra; // Dados originais do item para exibição

  constructor() {}

  ngOnInit(): void {
    if (!this.itemForm || !this.itemOriginal) {
      console.error(
        'CompraItemComponent: itemForm ou itemOriginal não foram fornecidos.',
      );
      return;
    }

    [
      this.precoAtualControl,
      this.valorOfertaControl,
      this.valorOriginalNaLojaControl,
    ].forEach((control) => this.formatToTwoDecimals(control));

    // Adiciona validação condicional para valorOferta e valorOriginalNaLoja
    this.itemForm.get('emOfertaNaLoja')?.valueChanges.subscribe((emOferta) => {
      const valorOfertaControl = this.itemForm.get('valorOferta');
      const valorOriginalNaLojaControl = this.itemForm.get(
        'valorOriginalNaLoja',
      );

      if (emOferta) {
        valorOfertaControl?.setValidators([
          Validators.required,
          Validators.min(0.01),
        ]);
        valorOriginalNaLojaControl?.setValidators([
          Validators.required,
          Validators.min(0.01),
        ]);
      } else {
        valorOfertaControl?.clearValidators();
        valorOriginalNaLojaControl?.clearValidators();
        valorOfertaControl?.patchValue(null); // Limpa o valor se não estiver em oferta
        valorOriginalNaLojaControl?.patchValue(null);
      }
      valorOfertaControl?.updateValueAndValidity();
      valorOriginalNaLojaControl?.updateValueAndValidity();
    });

    // Dispara a validação inicial se o formulário já estiver em oferta
    if (this.itemForm.get('emOfertaNaLoja')?.value) {
      this.itemForm.get('emOfertaNaLoja')?.updateValueAndValidity();
    }
  }

  normalizeQuantity(): void {
    const value = Number(this.quantidadeControl.value);

    if (!value || value < 1) {
      this.quantidadeControl.setValue(1);
      return;
    }

    this.quantidadeControl.setValue(Math.floor(value));
  }

  increaseQuantity(): void {
    const current = this.quantidadeControl.value ?? 1;
    this.quantidadeControl.setValue(current + 1);
  }

  decreaseQuantity(): void {
    const current = this.quantidadeControl.value ?? 1;
    if (current > 1) {
      this.quantidadeControl.setValue(current - 1);
    }
  }

  get quantidadeControl(): FormControl {
    return this.itemForm.get('quantidade') as FormControl;
  }

  // Getter para acesso mais fácil aos controles no template
  get estaNoCarrinhoControl(): FormControl {
    return this.itemForm.get('estaNoCarrinho') as FormControl;
  }

  get precoAtualControl(): FormControl {
    return this.itemForm.get('precoAtual') as FormControl;
  }

  get emOfertaNaLojaControl(): FormControl {
    return this.itemForm.get('emOfertaNaLoja') as FormControl;
  }

  get valorOfertaControl(): FormControl {
    return this.itemForm.get('valorOferta') as FormControl;
  }

  get valorOriginalNaLojaControl(): FormControl {
    return this.itemForm.get('valorOriginalNaLoja') as FormControl;
  }

  formatToTwoDecimals(control: FormControl | null): void {
    if (!control) return;

    const value = control.value;

    if (value === null || value === undefined || value === '') return;

    const numericValue = Number(value);

    if (isNaN(numericValue)) return;

    const formatted = Number(numericValue.toFixed(2));

    // Evita loop desnecessário
    if (formatted !== numericValue) {
      control.setValue(formatted, { emitEvent: false });
    }
  }
}

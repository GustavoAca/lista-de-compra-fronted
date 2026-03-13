import { Component, OnInit, input, inject, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ItemCompra } from '@app/features/compra/models/item-compra.model';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material Imports
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-compra-item',
  templateUrl: './compra-item.component.html',
  styleUrls: ['./compra-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
})
export class CompraItemComponent implements OnInit {
  // Novas APIs de Input do Angular
  itemForm = input.required<FormGroup>();
  itemOriginal = input.required<ItemCompra>();

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const form = this.itemForm();
    
    [
      this.precoAtualControl,
      this.valorOfertaControl,
      this.valorOriginalNaLojaControl,
    ].forEach((control) => this.formatToTwoDecimals(control));

    // Adiciona validação condicional usando pipe moderno para limpeza
    form.get('emOfertaNaLoja')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((emOferta) => {
        this.updateOfferValidators(emOferta);
      });

    // Dispara a validação inicial se o formulário já estiver em oferta
    if (form.get('emOfertaNaLoja')?.value) {
      this.updateOfferValidators(true);
    }
  }

  private updateOfferValidators(emOferta: boolean): void {
    const form = this.itemForm();
    const valorOfertaControl = form.get('valorOferta');
    const valorOriginalNaLojaControl = form.get('valorOriginalNaLoja');

    if (emOferta) {
      const validators = [Validators.required, Validators.min(0.01)];
      valorOfertaControl?.setValidators(validators);
      valorOriginalNaLojaControl?.setValidators(validators);
    } else {
      valorOfertaControl?.clearValidators();
      valorOriginalNaLojaControl?.clearValidators();
      valorOfertaControl?.patchValue(null);
      valorOriginalNaLojaControl?.patchValue(null);
    }
    
    valorOfertaControl?.updateValueAndValidity();
    valorOriginalNaLojaControl?.updateValueAndValidity();
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
    return this.itemForm().get('quantidade') as FormControl;
  }

  get estaNoCarrinhoControl(): FormControl {
    return this.itemForm().get('estaNoCarrinho') as FormControl;
  }

  get precoAtualControl(): FormControl {
    return this.itemForm().get('precoAtual') as FormControl;
  }

  get emOfertaNaLojaControl(): FormControl {
    return this.itemForm().get('emOfertaNaLoja') as FormControl;
  }

  get valorOfertaControl(): FormControl {
    return this.itemForm().get('valorOferta') as FormControl;
  }

  get valorOriginalNaLojaControl(): FormControl {
    return this.itemForm().get('valorOriginalNaLoja') as FormControl;
  }

  formatToTwoDecimals(control: FormControl | null): void {
    if (!control) return;
    const value = control.value;
    if (value === null || value === undefined || value === '') return;
    const numericValue = Number(value);
    if (isNaN(numericValue)) return;
    const formatted = Number(numericValue.toFixed(2));
    if (formatted !== numericValue) {
      control.setValue(formatted, { emitEvent: false });
    }
  }
}

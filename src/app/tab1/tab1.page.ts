import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})

export class Tab1Page {
  horarios: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchHorarios();
  }

  fetchHorarios() {
    this.http.get<any[]>('http://localhost:9000/horarios')
      .subscribe(data => {
        this.horarios = data;
      });
  }
}


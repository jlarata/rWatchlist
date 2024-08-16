import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WatchListComponent } from "./watch-list/watch-list.component";
import { HeaderComponent } from "./header/header.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WatchListComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'rWatchlist';
}

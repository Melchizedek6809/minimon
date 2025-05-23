import './style.css';
import './game.css';

import options from './options';
import { Game, Types } from 'phaser';
import { WorldScene } from './scenes/game/worldScene';
import { UIScene } from './scenes/ui/uiScene';
import { GameOverScene } from './scenes/menu/gameOver';
import { MainMenuScene } from './scenes/menu/mainMenu';
import { GameWonScene } from './scenes/menu/gameWon';
import { LoadingScreenScene } from './scenes/menu/loadingScreen';

const main = () => {
    const config: Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        width: 1280,
        height: 720,
        //pixelArt: true,
        parent: document.getElementById('phaser-parent') as HTMLElement,
        title: 'Vite / Phaser / TypeScript starter template',
        backgroundColor: '#000',
        dom: {
            createContainer: true,
        },
        input: {
            gamepad: true,
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {x: 0, y: 0 },
                debug: options.showCollider,
            },
        },
        scene: [
            LoadingScreenScene,
            MainMenuScene,
            WorldScene,
            UIScene,
            GameOverScene,
            GameWonScene,
        ],
    };
    const game = new Game(config);
};
setTimeout(main, 0);

# Queens Puzzle Game

A browser-based puzzle game inspired by LinkedIn's Queens puzzle. Place queens on a grid following specific rules in this challenging logic game.

## 🎮 Play Now

Visit: [Your GitHub Pages URL will be here after deployment]

## 🎯 Game Rules

- Place exactly **one queen** in each row, column, and color region
- Queens **cannot touch** each other, not even diagonally
- Tap once to place an X, twice for a queen, tap again to clear
- Every puzzle is **guaranteed to be solvable**

## 🌟 Features

- **5-Minute Time Windows**: New puzzle every 5 minutes - everyone playing at the same time gets the same board
- **Timer**: Track your solving speed
- **Hint System**: Get hints with a 20-second cooldown
- **Show Solution**: Available after 5 minutes (for when you're stuck)
- **Draggable Win Modal**: Move the congratulations screen to examine your solution
- **Responsive Design**: Works on desktop and mobile

## 🚀 How to Play with Friends

1. Both players load the game at the same time
2. Click "New Game" together (you'll get the same puzzle)
3. Race to see who solves it faster!
4. The 5-minute time window ensures everyone gets identical boards

## 🛠️ Technical Details

- **Pure vanilla JavaScript** - No frameworks or build tools
- **Static website** - Can be hosted on GitHub Pages
- **Seeded random generation** - Synchronized puzzles across all players
- **Backtracking solver** - Ensures all puzzles are solvable

## 📦 Project Structure

```
queens/
├── index.html      # Main HTML file
├── style.css       # All styling
├── script.js       # Game logic
└── README.md       # This file
```

## 🏃 Running Locally

1. Clone this repository
2. Open `index.html` in your browser, or
3. Run a local server:
   ```bash
   python -m http.server 8000
   ```
4. Navigate to `http://localhost:8000`

## 🎨 Game Controls

- **New Game**: Start a new puzzle (timer begins immediately)
- **Clear Board**: Reset the current puzzle
- **Hint**: Highlight one correct queen position (20s cooldown)
- **Show Solution**: Reveal the complete solution (unlocks after 5 minutes)
- **How to Play**: Toggle instructions

## 📄 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Made with ❤️ for puzzle enthusiasts

!(function () {
	// HELPER
	const rn = (min, max) => { return Math.floor(Math.random() * (max - min)) + min; }

	// ADD BUBBLES
	for (let i = 0; i < 10; i++) {
		let dim = rn(10, 30);
		let e = document.createElement("div");
		e.classList.add("bubble");
		e.style = `width:${dim}px;height:${dim}px;left:${rn(40, 60)}%;animation-delay:${rn(0, 30)}s;opacity:${rn(1, 4) / 10};`;
		document.body.appendChild(e);
	}

	// CHOOSING DIFFICULTY STARTS THE GAME
	$(".bsize").click(function () {

		// SHOW BOARD
		$("#board").fadeToggle(1000);

		// GET DIFFICULTY
		let diff = this.innerText;
		let size;

		// SET NUMBER OF BOMBS BASED ON DIFFICULTY
		if (diff === "easy") { size = 10; numBombs = 10 };
		if (diff === "medium") { size = 20; numBombs = 40 };
		if (diff === "hard") { size = 25; numBombs = 99 };

		// REMOVE SIZE SELECTION INPUT
		$("#g-size").remove();

		// PLACE RANDOM BOMBS IN ARRAY
		let bombs = [];
		let j = 0;
		while (j < numBombs) {
			let bomb = [rn(0, size), rn(0, size)];
			for (let k = 0; k < bombs.length - 1; k++) {
				if (bombs[k][0] === bomb[0] && bombs[k][1] === bomb[1]) {
					bombs.splice(k, 1);
					j--;
				}
			}
			bombs.push(bomb);
			j++;
		}

		// CREATE GAMEBOARD IN DOM
		for (let i = 0; i < size; i++) {
			$("#board").append("<div class='row' id='row" + i + "'>");
			for (let j = 0; j < size; j++) {
				$("#row" + i).append("<div class='cell' id='c_" + i + "_" + j + "'></div>")
			}
			$("#board").append("</div>");
		}

		// FILL BOARD (with bombs and adjacent counts);
		for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
				let num = fillBoard(i, j); // fillBoard function below
				$("#c_" + i + "_" + j).html(num);
				if (num === "*") { $("#c_" + i + "_" + j).addClass("bomb") }
			}

		// FILL BOARD FUNCTION (for each cell on the board, returns number of adjacent bombs)
		function fillBoard(row, col) {
			let count = 0;
			for (let i = 0; i < bombs.length; i++) {
				if (bombs[i][0] === (row + 0) && bombs[i][1] === (col + 0)) { count = "*"; break; }
				if (bombs[i][0] === (row - 1) && bombs[i][1] === (col - 1)) count++;
				if (bombs[i][0] === (row - 1) && bombs[i][1] === (col - 0)) count++;
				if (bombs[i][0] === (row - 1) && bombs[i][1] === (col + 1)) count++;
				if (bombs[i][0] === (row - 0) && bombs[i][1] === (col - 1)) count++;
				if (bombs[i][0] === (row - 0) && bombs[i][1] === (col + 1)) count++;
				if (bombs[i][0] === (row + 1) && bombs[i][1] === (col - 1)) count++;
				if (bombs[i][0] === (row + 1) && bombs[i][1] === (col - 0)) count++;
				if (bombs[i][0] === (row + 1) && bombs[i][1] === (col + 1)) count++;
			}
			if (count === 0) { count = ""; }
			return count;
		}

		// SET NUMBER OF REMAINING BOMBS INTO DOM
		$("#remaining").html(("00" + numBombs).slice(-3)); // this format assures there'll always be 3 digits (it's also used for timer)

		// GAME TIMER (ends @ 999s)
		let timer = setInterval(() => {
			let time = Number($("#timer").html());
			time += 1;
			$("#timer").html(("00" + time).slice(-3));
			if (time === 999) { // game ends if timer reaches 999 (also, if a bomb is clicked; 2 ways to lose)
				$(".cell").off("mousedown").off("mouseup").off("contextmenu");
				clearInterval(timer);
			}
		}, 1000);

		// ARRAY OF SEARCHED CELLS
		let arr0 = []; // this holds cell ids as they are revealed

		// MOUSE CLICK TRACKER
		let mouse = 0; // each mousedown event sends a readable number that's captured and added to 'mouse' (to read a both mouse button click)

		// MOUSEDOWN change face image & add button pressed; MOUSEUP change back
		$(".cell").mousedown(function (e) {
			mouse += e.which; // sums pressed mouse button values. the sum gets reset after it's read on the mouseup event
		});

		// MOUSEUP evaluate click
		$(".cell").mouseup(function (e) {

			e.preventDefault(); // prevent context menu on right-click

			// BOTH MOUSE BUTTONS CLICKED (you do this as an expedient to reveal more cells, when you expect you've flagged all adjacent bombs)
			if (mouse === 4) { // both mouse buttons clicked (sum of mousedown events is 'mouse', above)
				mouse = 0; // reset mouse to stop second mouseup event
				let flags = 0; // number of adjacent flags
				let hhh = this.innerHTML; // this cell's html is the number of adjacent bombs
				let row = this.id.split("_")[1];
				let col = this.id.split("_")[2];
				let adj = search(row, col); // get 8 (or less) adjacent cells' ids
				for (let n = 0; n < adj.length; n++) {
					let c = $("#" + adj[n]);
					if (c.hasClass("flag") && c.html() === "*") {
						flags++; // increment flags
					}
				}
				if (flags === Number(hhh)) { // number of adjacent bombs should be equal to number of adjacent flags
					checkThis(row, col);
				} else { return; } // a double-click where player hasn't flagged all the adjacent bombs won't reveal an unflagged bomb
				return;
			}

			if (e.which === 3) { // right-click (contextmenu) is below
				return;
			}

			// push this cell's id into ref array
			arr0.push(this.id.toString());

			if (e.which === 1) {
				mouse = 0; // reset record of clicked buttons
				// evaluate this cell's html
				switch (this.innerHTML) {
					case "*": // bomb clicked: end the game
						$(".bomb").html($("#bomb")); // add a bomb svg
						clearInterval(timer); // stop the timer
						$(".cell").off("mousedown").off("mouseup").off("contextmenu"); // disable functions except for game reset 
						break;
					case "":
						if ($(this).hasClass("empty")) { return; } // cells with the empty class only got it by being evaluated, so stop evaluating this cell
						else { $(this).addClass("empty"); } // changes its appearance
						let row = Number(this.id.split("_")[1]);
						let col = Number(this.id.split("_")[2]);
						checkThis(row, col); // empty cell clicks trigger adjacent empty cells; checkThis starts a border-finding algorithm
						break;
					default:
						if ($(this).hasClass("full")) { return; } // this cell was already clicked
						else { $(this).addClass("full"); } // i.e. it got the 'full' class here
				}
			}
		});

		// LISTEN FOR RIGHT CLICKS (sets flag and decrements remaining bombs)
		$(".cell").contextmenu(function (e) {
			e.preventDefault(); // prevents context menu from opening
			if (mouse !== 3) { return; } // stop if more than one button was clicked
			let num = $("#remaining").html(); // remaining bombs
			if (num.match("-")) { // read num as a number
				num = Number(num.split("-")[1]) * -1; // make negative again
			} else {
				num = Number(num);
			}
			if ($(this).hasClass("flag")) {
				$(this).removeClass("flag"); // remove the flag
				arr0.splice(arr0.indexOf(this.id), 1); // also, splice it out of the reference array
				$("#remaining").html(("00" + Number(num + 1)).slice(-3)); // and add back the remaining bomb
			}
			else {
				$(this).addClass("flag"); // flag it
				arr0.push(this.id); // add cell to reference array
				$("#remaining").html(("00" + Number(num - 1)).slice(-3)); // decrement remaining bombs

				// WIN CONDITION (my version differs from the original in that you can win by flagging all the bombs correctly, without revealing all the cells)
				if ($("#remaining").html() === "000") {
					let match = 0;
					let flags = $(".flag").sort();
					let bombs = $(".bomb").sort();
					for (let i = 0; i < flags.length; i++) {
						if (flags[i] === bombs[i]) {
							match++;
						}
					}
					if (match === bombs.length) {
						$(".cell").off("mousedown").off("mouseup").off("contextmenu");
						clearInterval(timer);
					}
				}
			}
			mouse = 0; // reset mouse clicks
		});

		// EMPTY CELLS (from switch, above)
		function checkThis(row, col) {
			row = Number(row);
			col = Number(col);
			let arr1 = [];
			let srch = search(row, col); // gets ids of 8 (or less) surrounding cells

			for (let i = 0; i < srch.length; i++) {
				let cell = srch[i];
				if ($("#" + cell).attr("id") !== undefined && arr0.indexOf(cell) === -1) { // off-grid cells come back with undefined ids
					arr0.push(cell); // push to reference array (cells already looked at)
					arr1.push(cell); // temp array push (elements gets evaluated then spliced out until array.length === 0, ending click evaluation)
				}
			}

			while (arr1.length > 0) {
				for (let j = 0; j < arr1.length; j++) {
					let cell = arr1[j];
					if ($("#" + cell).html() !== "") { // non-empty cells
						$("#" + cell).addClass("full"); // changes style to show its number
						arr1.splice(j, 1); // cut this out of the temp array
						j--; // update the increment so it won't skip the next element
					} else {
						$("#" + cell).addClass("empty");
						row = Number(cell.toString().split("_")[1]);
						col = Number(cell.toString().split("_")[2]);
						let x = search(row, col); // gets 8 (or fewer) adjacent cells' ids
						for (let k = 0; k < x.length; k++) { // checks both arrays (temp and reference) for this id, and pushes if it's not included
							if ($("#" + x[k].toString()).attr("id") !== undefined && arr1.indexOf(x[k].toString()) === -1 && arr0.indexOf(x[k].toString()) === -1) {
								arr1.push(x[k]);
								arr0.push(x[k]);
							}
						}
						arr1.splice(j, 1); // cut this id out of temp array
						j--; // update the increment so it won't skip the next element
					}
				}
			}
		}

		function search(row, col) { // gets ids of adjacent cells
			let arr = [ // the row/col of adjacent cells. Note that their existence is assumed, but not guaranteed: e.g. a cell on the edge of the board
				("c_" + row + "_" + (Number(col) - 1)).toString(),
				("c_" + row + "_" + (Number(col) + 1)).toString(),
				("c_" + (Number(row) - 1) + "_" + col).toString(),
				("c_" + (Number(row) + 1) + "_" + col).toString(),
				("c_" + (Number(row) - 1) + "_" + (Number(col) - 1)).toString(),
				("c_" + (Number(row) - 1) + "_" + (Number(col) + 1)).toString(),
				("c_" + (Number(row) + 1) + "_" + (Number(col) - 1)).toString(),
				("c_" + (Number(row) + 1) + "_" + (Number(col) + 1)).toString(),
			];
			return arr;
		}
	});
})();
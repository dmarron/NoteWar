/**
* Note War - a 2 player competitive puzzle game.  Programmed by David Marron
 */
dojo.provide('myapp.NoteWar');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.CheckBox');
dojo.require('dojox.timing._base');
dojo.require('dojo.i18n');
dojo.require('dojo.number');
//dojo.require('uow.audio.JSonic');
dojo.requireLocalization('myapp', 'NoteWar');

dojo.declare('myapp.NoteWar', [dijit._Widget, dijit._Templated], {
    widgetsInTemplate: true,
	templatePath: dojo.moduleUrl('myapp.templates', 'NoteWar.html'),

	postCreate: function() {
		this.connect(window,'onkeyup','_onKeyPress');
		this.connect(window,'onkeydown','_onKeyDown');
		this.connect(window,'onclick','_onClick');
		dojo.connect(dojo.doc, 'onkeypress', function(event) {
            if(event.target.size === undefined &&
               event.target.rows === undefined &&
               event.keyCode == dojo.keys.BACKSPACE) {
                // prevent backspace page nav
                event.preventDefault();
            }
        } );
		this.introPage();
	},
    postMixInProperties: function() {
		//initialize jsonic from unc open web
		uow.getAudio({defaultCaching: true}).then(dojo.hitch(this, function(js) { this.js = js; }));
		this.playerOneNotes = new Array(4,3,2,1,0);
		this.playerTwoNotes = new Array(4,3,2,1,0);
		//this.playerOneNotes = new Array(1,3,0,4,2);
		//this.playerTwoNotes = new Array(3,0,4,2,1);
		this.blocks = new Array(0,0,0,0,0);
		this.turn = 1;
		//this.select = "note";
		this.select = "block";
		this.mode = "intro";
		this.currentSlot = 0;
		//this.currentRow = 0;
		this.currentRow = 1;
		this.nonZeroCount = 0;
		this.previousValue = 0;
		this.duplicate = 0;
		//this.graphicsMode = "letters";
		this.graphicsMode = "notes";
		this.gameMode = "normal";
		this.numberOfMoves = 0;
		this.recordMoves = 0;
		this.animateComputer = true;
		this.animating = false;
		this.animateEndOfTurn = false;
		this.displayGhostNotes = false;
		this.tutorialPage = 1;
    },
	_onClick: function(e) {
		
	},
	_onKeyDown: function(e) {
		if (e.keyCode == 16 && this.mode != "intro" && !this.animating) {
			//shift pressed 
			if (!this.displayGhostNotes) {
				this.displayGhostNotes = true;
				this.updateCanvas();
			}
		}
	},
	_onKeyPress: function(e) {
		if (!this.animating) {
			//play shifts first
			if (this.nonZeroCount != this.blocks.length) {
				if (this.select == "note") {
					this.select = "block";
				}
			}
		
			if (e.keyCode == 37) {
				//left arrow
				if (this.mode == "select" && this.select != "1" && this.select != "2") {
					this.currentSlot--;
					if (this.currentSlot < 0) {
						this.currentSlot = 4;
					}
					//play sounds
					if (this.currentRow == 0) {
						this.playNote(this.playerOneNotes[this.currentSlot]);
					} else if (this.currentRow == 1) {
						this.playBlock(this.blocks[this.currentSlot]);
					} else if (this.currentRow == 2) {
						this.playNote(this.playerTwoNotes[this.currentSlot]);
					}
					this.updateCanvas();
				}
			} else if (e.keyCode == 39) {
				//right arrow
				if (this.mode == "select" && this.select != "1" && this.select != "2") {
					this.currentSlot++;
					if (this.currentSlot > 4) {
						this.currentSlot = 0;
					}
					//play sounds
					if (this.currentRow == 0) {
						this.playNote(this.playerOneNotes[this.currentSlot]);
					} else if (this.currentRow == 1) {
						this.playBlock(this.blocks[this.currentSlot]);
					} else if (this.currentRow == 2) {
						this.playNote(this.playerTwoNotes[this.currentSlot]);
					}
					this.updateCanvas();
				}
			} else if (e.keyCode == 38) {
				//up arrow
				if (this.mode == "intro") {
					this.currentRow --;
					if (this.currentRow < 0) {
						this.currentRow = 3;
					}
					//todo: read word
					this.drawIntroPage();
				} else if (this.mode == "tutorial") {
					
				} else {
					if (this.select == "note") {
						if (this.mode == "change") {
							if (this.turn == 1) {
								//player 1's turn
								this.playerOneNotes[this.currentSlot] ++;
								if (this.playerOneNotes[this.currentSlot] > 4) {
									this.playerOneNotes[this.currentSlot] = 0;
								}
								
							} else {
								this.playerTwoNotes[this.currentSlot] ++;
								if (this.playerTwoNotes[this.currentSlot] > 4) {
									this.playerTwoNotes[this.currentSlot] = 0;
								}
							}
							this.updateCanvas();
						} else {
							this.currentRow--;
							if (this.currentRow < 0) {
								this.currentRow = 2;
							}
							if (this.gameMode == "practice" && this.currentRow == 2) {
								this.currentRow = 1;
							}
							this.updateCanvas();
						}
					} else if (this.select == "block") {
						if (this.mode == "change") {
							this.blocks[this.currentSlot]++;
							if (this.blocks[this.currentSlot] > 2) {
								this.blocks[this.currentSlot] = -2;
							}
							//if (this.blocks[this.currentSlot] > 1) {
							//	this.blocks[this.currentSlot] = -1;
							//}
							if (this.blocks[this.currentSlot] == 0) {
								this.blocks[this.currentSlot] = 1;
							}
							this.updateCanvas();
						} else {
							this.currentRow--;
							if (this.currentRow < 0) {
								this.currentRow = 2;
							}
							if (this.gameMode == "practice" && this.currentRow == 2) {
								this.currentRow = 1;
							}
							this.updateCanvas();
						}
					}
					//play sounds
					if (this.currentRow == 0) {
						this.playNote(this.playerOneNotes[this.currentSlot]);
					} else if (this.currentRow == 1) {
						this.playBlock(this.blocks[this.currentSlot]);
					} else if (this.currentRow == 2) {
						this.playNote(this.playerTwoNotes[this.currentSlot]);
					}
				}
			} else if (e.keyCode == 40) {
				//down arrow
				if (this.mode == "intro") {
					this.currentRow ++;
					if (this.currentRow > 3) {
						this.currentRow = 0;
					}
					//todo: read word
					this.drawIntroPage();
				} else if (this.mode == "tutorial") {
				} else {
					if (this.select == "note") {
						if (this.mode == "change") {
							if (this.turn == 1) {
								//player 1's turn
								this.playerOneNotes[this.currentSlot] --;
								if (this.playerOneNotes[this.currentSlot] < 0) {
									this.playerOneNotes[this.currentSlot] = 4;
								}
							} else {
								this.playerTwoNotes[this.currentSlot] --;
								if (this.playerTwoNotes[this.currentSlot] < 0) {
									this.playerTwoNotes[this.currentSlot] = 4;
								}
							}
							this.updateCanvas();
						} else {
							this.currentRow++;
							if (this.currentRow > 2) {
								this.currentRow = 0;
							}
							if (this.gameMode == "practice" && this.currentRow > 1) {
								this.currentRow = 0;
							}
							this.updateCanvas();
						}
					} else if (this.select == "block") {
						if (this.mode == "change") {
							this.blocks[this.currentSlot]--;
							//if (this.blocks[this.currentSlot] < -1) {
							//	this.blocks[this.currentSlot] = 1;
							//}
							if (this.blocks[this.currentSlot] < -2) {
								this.blocks[this.currentSlot] = 2;
							}
							if (this.blocks[this.currentSlot] == 0) {
								this.blocks[this.currentSlot] = -1;
							}
							this.updateCanvas();
						} else {
							this.currentRow++;
							if (this.currentRow > 2) {
								this.currentRow = 0;
							}
							if (this.gameMode == "practice" && this.currentRow > 1) {
								this.currentRow = 0;
							}
							this.updateCanvas();
						}
					}
					//play sounds
					if (this.currentRow == 0) {
						this.playNote(this.playerOneNotes[this.currentSlot]);
					} else if (this.currentRow == 1) {
						this.playBlock(this.blocks[this.currentSlot]);
					} else if (this.currentRow == 2) {
						this.playNote(this.playerTwoNotes[this.currentSlot]);
					}
				}
			} else if (e.keyCode == 13) {
				//enter pressed
				if (this.mode == "intro") {
					if (this.currentRow == 0) {
						this.drawTutorial();
					} else if (this.currentRow == 1) {
						this.gameMode = "practice";
						this.mode = "select";
						this.updateCanvas();
					} else if (this.currentRow == 2) {
						this.gameMode = "1player";
						this.mode = "select";
						this.currentRow = 1;
						this.updateCanvas();
					} else {
						this.gameMode = "normal";
						this.mode = "select";
						this.currentRow = 1;
						this.updateCanvas();
					}
				} else if (this.mode == "tutorial") {
					this.tutorialPage ++;
					this.drawTutorial();
				} else if (this.select == "1" || this.select == "2") {
					//new game
					this.playerOneNotes = new Array(4,3,2,1,0);
					this.playerTwoNotes = new Array(4,3,2,1,0);
					this.blocks = new Array(0,0,0,0,0);
					this.turn = 1;
					this.select = "note";
					this.mode = "select";
					this.currentSlot = 0;
					//this.currentRow = 0;
					this.currentRow = 1;
					this.previousValue = 0;
					this.nonZeroCount = 0;
					this.numberOfMoves = 0;
					this.updateCanvas();
				} else {
					if (this.mode == "select") {
						if (this.select == "note") {
							if ((this.turn == 1 && this.currentRow == 0) || (this.turn == 2 && this.currentRow == 2)) {
								this.mode = "change";
								if (this.turn == 1) {
									this.previousValue = this.playerOneNotes[this.currentSlot];
								} else {
									this.previousValue = this.playerTwoNotes[this.currentSlot];
								}
							}
						} else if (this.select == "block") {
							if (this.blocks[this.currentSlot] == 0 || this.nonZeroCount == this.blocks.length) {
								if (this.currentRow == 1) {
									this.mode = "change";
									this.previousValue = this.blocks[this.currentSlot];
								} else {
									//player has selected the wrong row
								}
							} else {
								//say that the block cannot be changed yet
							}
						}
					} else if (this.mode == "change") {
						if (this.select == "note") {
							var checkWin = false;
							if (this.turn == 1) {
								for (i = 0; i < this.playerOneNotes.length; i++) {
									/*if (this.playerOneNotes[i] != i) {
										checkWin = false;
									}*/
									if (this.playerOneNotes[i] == 0) {
										checkWin = true;
										for (var j = i+1; j < i+this.playerOneNotes.length; j++) {
											if (this.playerOneNotes[j%5] != j-i) {
												checkWin = false;
											}
										}
									}
								}
								if (checkWin) {
									this.select = "1";
								}
							} else if (this.turn == 2) {
								for (i = 0; i < this.playerTwoNotes.length; i++) {
									/*if (this.playerTwoNotes[i] != i) {
										checkWin = false;
									}*/
									if (this.playerTwoNotes[i] == 0) {
										checkWin = true;
										for (var j = i+1; j < i+this.playerTwoNotes.length; j++) {
											if (this.playerTwoNotes[j%5] != j-i) {
												checkWin = false;
											}
										}
									}
								}
								if (checkWin) {
									this.select = "2";
								}
							}
							if (!checkWin) {
								this.select = "block";
								this.currentRow = 1;
								this.mode = "select";
							}
						} else if (this.select == "block") {
							if (this.blocks[this.currentSlot] != 0) {
								this.select = "note";
								this.turn ++;
								if (this.turn > 2) {
									this.turn = 1;
									//Play shifts first
									if (this.nonZeroCount >= this.blocks.length-1) {
										this.currentRow = 0;
									} else {
										this.currentRow = 1;
									}
								} else {
									if (this.nonZeroCount >= this.blocks.length-1) {
										this.currentRow = 2;
									} else {
										this.currentRow = 1;
									}
								}
								this.mode = "select";
								this.endTurn();
							} else {
								//say that the value must be set
							}
						}

					}
					this.updateCanvas();
				}
			} else if (e.keyCode == 27) {
				//escape pressed
				if (this.select == "1" || this.select == "2" || this.mode == "tutorial") {
					//reset all values and go back to menu
					this.playerOneNotes = new Array(4,3,2,1,0);
					this.playerTwoNotes = new Array(4,3,2,1,0);
					this.blocks = new Array(0,0,0,0,0);
					this.turn = 1;
					this.select = "note";
					this.mode = "intro";
					this.currentSlot = 0;
					this.currentRow = 0;
					this.previousValue = 0;
					this.nonZeroCount = 0;
					this.numberOfMoves = 0;
					this.tutorialPage = 1;
					this.drawIntroPage();
				} else if (this.mode == "change") {
					this.mode = "select";
					if (this.select == "note") {
						if (this.turn == 1) {
							this.playerOneNotes[this.currentSlot] = this.previousValue;
						} else {
							this.playerTwoNotes[this.currentSlot] = this.previousValue;
						}
					} else if (this.select == "block") {
						this.blocks[this.currentSlot] = this.previousValue;
					}
					this.updateCanvas();
				}
			} else if (e.keyCode == 16) {
				if (this.displayGhostNotes) {
					this.displayGhostNotes = false;
					this.updateCanvas();
				}
			} else if (e.keyCode == 8) {
				//backspace pressed
				//reset all values and go back to menu
					this.playerOneNotes = new Array(4,3,2,1,0);
					this.playerTwoNotes = new Array(4,3,2,1,0);
					this.blocks = new Array(0,0,0,0,0);
					this.turn = 1;
					this.select = "note";
					this.mode = "intro";
					this.currentSlot = 0;
					this.currentRow = 0;
					this.previousValue = 0;
					this.nonZeroCount = 0;
					this.numberOfMoves = 0;
					this.tutorialPage = 1;
					this.drawIntroPage();
			}
		}
	},
	playNote: function(noteID) {
		this.duplicate++;
		if (this.duplicate == 1) {
			this.musicNotes[noteID].play();
		} else if (this.duplicate == 2) {
			this.duplicateNotes[noteID].play();
		} else {
			this.duplicate = 0;
			this.duplicateNotesTwo[noteID].play();
		}
	},
	playBlock: function(noteID) {
		this.duplicate++;
		if (this.duplicate == 1) {
			if (noteID > 0) {
				this.blockSounds[noteID-1].play();
			} else if (noteID < 0) {
				this.blockSounds[(noteID*-1)+1].play();
			}
		} else if (this.duplicate == 2) {
			if (noteID > 0) {
				this.duplicateBlocks[noteID-1].play();
			} else if (noteID < 0) {
				this.duplicateBlocks[(noteID*-1)+1].play();
			}
		} else {
			this.duplicate = 0;
			if (noteID > 0) {
				this.duplicateBlocksTwo[noteID-1].play();
			} else if (noteID < 0) {
				this.duplicateBlocksTwo[(noteID*-1)+1].play();
			}
		}
	},
	endTurn: function(event) {
		if (this.gameMode != "practice") {
			if (this.turn == 1) {
				this.js.say({text:"Player 1's turn"});
			} else {
				if (this.gameMode != "1player") {
					this.js.say({text:"Player 2's turn"});
				}
			}
		}
		var shiftedBlocks = [];
		this.nonZeroCount = 0;
		shiftedBlocks[0] = 0;
		if (this.animateEndOfTurn) {
			
		} else {
			for (i = 0; i < this.blocks.length; i++) {
				if (this.blocks[i] != 0) {
					this.nonZeroCount++;
					if (this.turn == 2) {
						this.playerOneNotes[i] += this.blocks[i];
						if (this.playerOneNotes[i] > 4) {
							this.playerOneNotes[i] -= 5;
						}
						if (this.playerOneNotes[i] < 0) {
							this.playerOneNotes[i] += 5;
						}
					} else {
						this.playerTwoNotes[i] += this.blocks[i];
						if (this.playerTwoNotes[i] > 4) {
							this.playerTwoNotes[i] -= 5;
						}
						if (this.playerTwoNotes[i] < 0) {
							this.playerTwoNotes[i] += 5;
						}
					}
				}
				if (i < this.blocks.length-1) {
					shiftedBlocks[i+1] = this.blocks[i];
				} else {
					shiftedBlocks[0] = this.blocks[i];
				}
			}
		}
		//if (this.nonZeroCount == 5) {
			for (i = 0; i < shiftedBlocks.length; i++) {
				//if (this.nonZeroCount == this.blocks.length) {
				//	this.blocks[i] = 0;
				//} else {
					this.blocks[i] = shiftedBlocks[i];
				//}
			}
		//}
		var checkWin = false;
		if (this.turn == 2) {
			for (i = 0; i < this.playerOneNotes.length; i++) {
				if (this.playerOneNotes[i] == 0) {
					checkWin = true;
					for (var j = i+1; j < i+this.playerOneNotes.length; j++) {
						if (this.playerOneNotes[j%5] != j-i) {
							checkWin = false;
						}
					}
				}
			}
			if (checkWin) {
				this.select = "1";
				this.turn = 1;
				this.mode = "change";
				this.currentRow = 1;
			}
		} else if (this.turn == 1) {
			for (i = 0; i < this.playerTwoNotes.length; i++) {
				if (this.playerTwoNotes[i] == 0) {
					checkWin = true;
					for (var j = i+1; j < i+this.playerTwoNotes.length; j++) {
						if (this.playerTwoNotes[j%5] != j-i) {
							checkWin = false;
						}
					}
				}
			}
			if (checkWin) {
				this.select = "2";
				this.turn = 2;
				this.mode = "change";
				this.currentRow = 1;
			}
		}
		if (!checkWin) {
			this.currentSlot = 0;
		}
		if (this.gameMode == "practice" && this.turn == 2 && !checkWin) {
			if (this.nonZeroCount == this.blocks.length) {
				this.currentRow = 0;
			}
			this.numberOfMoves++;
			this.turn = 1;
		} else if (this.gameMode == "1player" && this.turn == 2 && !checkWin) {
			if (this.nonZeroCount < this.blocks.length) {
				//randomly select an empty slot to play in
				var emptySlots = [];
				for (i = 0; i < this.blocks.length; i++) {
					if (this.blocks[i] == 0) {
						emptySlots.push(i);
					}
				}
				var rand = Math.floor(Math.random()*emptySlots.length);
				var randTwo = Math.floor(Math.random()*4);
				if (randTwo == 2) {
					randTwo = 4;
				}
				if (this.animateComputer) {
					this.animateComputerBlock(emptySlots[rand],randTwo-2);
				} else {
					this.blocks[emptySlots[rand]] = randTwo-2;
					this.turn = 1;
					this.endTurn();
				}
			} else {
				//AI to make the computer win if it is one note away
				var inOrder = 0;
				var maxOrder = 0;
				for (i = 1; i < this.playerTwoNotes.length*2; i++) {
					if (this.playerTwoNotes[i%5] == this.playerTwoNotes[(i-1)%5]+1 || this.playerTwoNotes[i%5] == this.playerTwoNotes[(i-1)%5]-4) {
						inOrder++;
					} else {
						if (inOrder == 3) {
							//computer could win
							if (this.animateComputer) {
								this.select = "2";
								this.animateComputerNote(i%5,(this.playerTwoNotes[(i-1)%5]+1)%5);
							} else {
								this.playerTwoNotes[i%5] = (this.playerTwoNotes[(i-1)%5]+1)%5;
								this.currentSlot = i%5;
								this.currentRow = 2;
								this.select = "2";
								this.mode = "change";
							}
						}
						if (inOrder > maxOrder) {
							maxOrder = inOrder;
						}
						inOrder = 0;
					}
				}
				if (maxOrder == 3) {
					//computer wins
					this.updateCanvas();
				} else {
					//otherwise just tweak a note and a block randomly
					var rand = Math.floor(Math.random()*this.playerTwoNotes.length)
					var randTwo = Math.floor(Math.random()*5);
					//make sure the new note is different than the current note
					while (randTwo == this.playerTwoNotes[rand]) {
						randTwo = Math.floor(Math.random()*5);
					}
					if (this.animateComputer) {
						this.animateComputerNote(rand,randTwo);
					} else {
						this.playerTwoNotes[rand] = randTwo;
						rand = Math.floor(Math.random()*this.blocks.length);
						randTwo = Math.floor(Math.random()*2)+1;
						if (this.blocks[rand] > 0) {
							randTwo = randTwo * -1;
						}
						this.blocks[rand] = randTwo;
						this.turn = 1;
						this.currentRow = 0;
						this.endTurn();
					}
				}
			}
		}
	},
	animateComputerNote: function(slot,value) {
		this.js.say({text:"Computer's turn"});
		this.animating = true;
		var tDelay = new dojox.timing.Timer();
		tDelay.setInterval(1000);
		tDelay.onTick = dojo.hitch(this,function() {
			this.postAnimateComputerNote(slot,value);
			tDelay.stop();
		});
		tDelay.start();
	},
	postAnimateComputerNote: function(slot,value) {
		//animate the computer selecting a block with the given slot position and block value
		var tNote = new dojox.timing.Timer();
		tNote.setInterval(400);
		this.animateSlot = 0;
		this.animateFinalSlot = slot;
		this.animateFinalValue = value;
		this.currentSlot = 0;
		this.mode = "select";
		if (slot == 0) {
			this.mode = "change";
		}
		this.playNote(this.playerTwoNotes[this.currentSlot]);
		//this.updateCanvas();
		tNote.onTick = dojo.hitch(this,function() {
			if (this.animateSlot < this.animateFinalSlot) {
				this.animateSlot++;
				this.currentSlot = this.animateSlot;
				this.playNote(this.playerTwoNotes[this.currentSlot]);
				var ctx = noteCanvas.getContext("2d");
				if (this.playerTwoNotes[this.currentSlot] == 0) {
					this.drawC(ctx,this.currentSlot,2);
				} else if (this.playerTwoNotes[this.currentSlot] == 1) {
					this.drawD(ctx,this.currentSlot,2);
				} else if (this.playerTwoNotes[this.currentSlot] == 2) {
					this.drawE(ctx,this.currentSlot,2);
				} else if (this.playerTwoNotes[this.currentSlot] == 3) {
					this.drawF(ctx,this.currentSlot,2);
				} else if (this.playerTwoNotes[this.currentSlot] == 4) {
					this.drawG(ctx,this.currentSlot,2);
				}
				if (this.playerTwoNotes[this.currentSlot-1] == 0) {
					this.drawC(ctx,this.currentSlot-1,2);
				} else if (this.playerTwoNotes[this.currentSlot-1] == 1) {
					this.drawD(ctx,this.currentSlot-1,2);
				} else if (this.playerTwoNotes[this.currentSlot-1] == 2) {
					this.drawE(ctx,this.currentSlot-1,2);
				} else if (this.playerTwoNotes[this.currentSlot-1] == 3) {
					this.drawF(ctx,this.currentSlot-1,2);
				} else if (this.playerTwoNotes[this.currentSlot-1] == 4) {
					this.drawG(ctx,this.currentSlot-1,2);
				}
				//update canvas will cause aggravating flashing
				//this.updateCanvas();
			} else {
				this.mode = "change";
				var ctx = noteCanvas.getContext("2d");
				if (this.playerTwoNotes[this.currentSlot] != this.animateFinalValue) {
					this.playerTwoNotes[this.currentSlot] = this.animateFinalValue;
					this.playNote(this.playerTwoNotes[this.currentSlot]);
					if (this.playerTwoNotes[this.currentSlot] == 0) {
						this.drawC(ctx,this.currentSlot,2);
					} else if (this.playerTwoNotes[this.currentSlot] == 1) {
						this.drawD(ctx,this.currentSlot,2);
					} else if (this.playerTwoNotes[this.currentSlot] == 2) {
						this.drawE(ctx,this.currentSlot,2);
					} else if (this.playerTwoNotes[this.currentSlot] == 3) {
						this.drawF(ctx,this.currentSlot,2);
					} else if (this.playerTwoNotes[this.currentSlot] == 4) {
						this.drawG(ctx,this.currentSlot,2);
					}
					//this.updateCanvas();
				} else {
					tNote.stop();
					this.mode = "select";
					rand = Math.floor(Math.random()*this.blocks.length);
					randTwo = Math.floor(Math.random()*2)+1;
					if (this.blocks[rand] > 0) {
						randTwo = randTwo * -1;
					}
					this.currentRow = 1;
					if (this.select != "2") {
						this.currentSlot--;
						if (this.playerTwoNotes[this.currentSlot+1] == 0) {
							this.drawC(ctx,this.currentSlot+1,2);
						} else if (this.playerTwoNotes[this.currentSlot+1] == 1) {
							this.drawD(ctx,this.currentSlot+1,2);
						} else if (this.playerTwoNotes[this.currentSlot+1] == 2) {
							this.drawE(ctx,this.currentSlot+1,2);
						} else if (this.playerTwoNotes[this.currentSlot+1] == 3) {
							this.drawF(ctx,this.currentSlot+1,2);
						} else if (this.playerTwoNotes[this.currentSlot+1] == 4) {
							this.drawG(ctx,this.currentSlot+1,2);
						}
						ctx.strokeStyle = "#ffff00";
						ctx.strokeRect(87,188,30,30);
						this.turn = 1;
						this.postAnimateComputerBlock(rand,randTwo);
					} else {
						this.mode = "change";
						this.currentRow = 2;
						this.updateCanvas();
						this.animating = false;
					}
					//this.endTurn();
					//this.updateCanvas();
				}
			}
		});
		tNote.start();
	},
	animateComputerBlock: function(slot,value) {
		this.js.say({text:"Computer's turn"});
		this.animating = true;
		var tDelay = new dojox.timing.Timer();
		tDelay.setInterval(1000);
		tDelay.onTick = dojo.hitch(this,function() {
			this.postAnimateComputerBlock(slot,value);
			tDelay.stop();
		});
		tDelay.start();
	},
	postAnimateComputerBlock: function(slot,value) {
		//animate the computer selecting a block with the given slot position and block value
		var tBlock = new dojox.timing.Timer();
		tBlock.setInterval(400);
		this.animateSlot = 0;
		this.animateFinalSlot = slot;
		this.animateValue = 0;
		this.animateFinalValue = value;
		this.currentSlot = 0;
		if (slot == 0) {
			//this.mode = "change";
			var ctx = noteCanvas.getContext("2d");
			ctx.fillStyle = "#ffffff";
			//"erase" the previous yellow rectangle by drawing 4 white rectangles (1 white won't work)
			ctx.fillRect(85,186,3,40);
			ctx.fillRect(85,186,40,3);
			ctx.fillRect(115,186,3,40);
			ctx.fillRect(85,216,40,3);
			ctx.strokeStyle = "#00ff00";
			ctx.strokeRect(87,188,30,30);
		}
		this.playBlock(this.blocks[this.currentSlot]);
		//this.updateCanvas();
		tBlock.onTick = dojo.hitch(this,function() {
			//if (!this.animating) {
				if (this.animateSlot < this.animateFinalSlot) {
					this.animateSlot++;
					this.currentSlot = this.animateSlot;
					//animate moving the rectangle without updating the whole canvas
					var ctx = noteCanvas.getContext("2d");
					ctx.lineWidth = 1;
					//ctx.strokeStyle = "#ffffff";
					//ctx.strokeRect(87+150*(this.currentSlot-1),188,30,30);
					ctx.fillStyle = "#ffffff";
					//"erase" the previous yellow rectangle by drawing 4 white rectangles (1 white won't work)
					ctx.fillRect(85+150*(this.currentSlot-1),186,3,40);
					ctx.fillRect(85+150*(this.currentSlot-1),186,40,3);
					ctx.fillRect(115+150*(this.currentSlot-1),186,3,40);
					ctx.fillRect(85+150*(this.currentSlot-1),216,40,3);
					if (this.currentSlot == this.animateFinalSlot) {
						ctx.strokeStyle = "#00ff00";
					} else {
						ctx.strokeStyle = "#ffff00";
					}
					ctx.strokeRect(87+150*this.currentSlot,188,30,30);
					this.playBlock(this.blocks[this.currentSlot]);
					//update canvas will cause aggravating flashing
					//this.updateCanvas();
				} else {
					//this.mode = "change";
					if (this.animateValue != this.animateFinalValue) {
						this.animateValue = this.animateFinalValue;
						this.blocks[this.currentSlot] = this.animateFinalValue;
						this.playBlock(this.blocks[this.currentSlot]);
						var ctx = noteCanvas.getContext("2d");
						ctx.save();
						ctx.font = "16pt Arial";
						ctx.fillStyle = "#fff";
						ctx.fillRect(88+this.currentSlot*150,189,27,27);
						ctx.fillStyle = "#000";
						if (this.animateFinalValue > 0) {
							ctx.fillText("+" + this.animateFinalValue, 91+this.currentSlot*150, 210);
						} else {
							ctx.fillText(this.animateFinalValue, 91+this.currentSlot*150, 210);
						}
						ctx.restore();
					} else {
						tBlock.stop();
						this.mode = "select";
						this.turn = 1;
						this.endTurn();
						if (this.nonZeroCount == this.blocks.length) {
							this.currentRow = 0;
						}
						this.updateCanvas();
						this.animating = false;
					}
					/*if (this.animateFinalValue < 0) {
						if (this.animateValue > this.animateFinalValue) {
							this.animateValue--;
							this.blocks[this.currentSlot] = this.animateValue;
							this.playBlock(this.blocks[this.currentSlot]);
							var ctx = noteCanvas.getContext("2d");
							ctx.save();
							ctx.font = "16pt Arial";
							ctx.fillStyle = "#fff";
							ctx.fillRect(88+this.currentSlot*150,179,27,27);
							ctx.fillStyle = "#000";
							ctx.fillText(this.animateValue, 91+this.currentSlot*150, 200);
							ctx.restore();
							//this.updateCanvas();
						} else {
							tBlock.stop();
							this.mode = "select";
							this.turn = 1;
							this.endTurn();
							this.updateCanvas();
							this.animating = false;
						}
					} else {
						if (this.animateValue < this.animateFinalValue) {
							this.animateValue++;
							this.blocks[this.currentSlot] = this.animateValue;
							this.playBlock(this.blocks[this.currentSlot]);
							var ctx = noteCanvas.getContext("2d");
							ctx.save();
							ctx.font = "16pt Arial";
							ctx.fillStyle = "#fff";
							ctx.fillRect(88+this.currentSlot*150,179,27,27);
							ctx.fillStyle = "#000";
							ctx.fillText("+" + this.animateValue, 91+this.currentSlot*150, 200);
							ctx.restore();
							//this.updateCanvas();
						} else {
							tBlock.stop();
							this.mode = "select";
							this.turn = 1;
							this.endTurn();
							this.updateCanvas();
							this.animating = false;
						}
					}*/
				}
			//}
		});
		tBlock.start();
	},
	updateCanvas: function(event) {
	
		//play shifts first
		if (this.nonZeroCount != this.blocks.length) {
			if (this.select == "note") {
				this.select = "block";
			}
		}
	
		var ctx = noteCanvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,noteCanvas.width,noteCanvas.height);
		ctx.fillStyle = "#000";
		ctx.font = "12pt Arial";
		if (this.turn == 1) {
			ctx.fillText("Player 1's turn", 10, 15);
		} else {
			if (this.gameMode != "1player") {
				ctx.fillText("Player 2's turn", 10, 15);
			} else {
				ctx.fillText("Computer's turn", 10, 15);
			}
		}
		if (this.select == "note") {
			if (this.mode == "select") {
				ctx.fillText("Choose a note with left and right and press enter to change it", 10, 30);
				ctx.strokeStyle = "#ffff00";
			} else if (this.mode == "change") {
				ctx.fillText("Press up and down to change the note and press enter to confirm or escape to cancel",10,30);
				ctx.strokeStyle = "#00ff00";
			}
			if (this.graphicsMode == "letters") {
				ctx.strokeRect(25+20*this.currentSlot,40 + this.currentRow*20,18,16);
			} else {
				if (this.currentRow == 1) {
					ctx.strokeRect(87+150*this.currentSlot,188,30,30);
				}
			}
		} else if (this.select == "block") {
			if (this.mode == "select") {
				ctx.fillText("Choose a slot with left and right and press enter to play a note shifter", 10, 30);
				ctx.strokeStyle = "#ffff00";
			} else if (this.mode == "change") {
				ctx.fillText("Press up and down to change the value and press enter to confirm or escape to cancel", 10, 30);
				ctx.strokeStyle = "#00ff00";
			}
			if (this.graphicsMode == "letters") {
				ctx.strokeRect(25+20*this.currentSlot,40 + this.currentRow*20,18,16);
			} else {
				if (this.currentRow == 1) {
					ctx.strokeRect(87+150*this.currentSlot,188,30,30);
				}
			}
		} else if (this.select == "1") {
			if (this.gameMode == "practice") {
				ctx.fillText("You won the game in " + this.numberOfMoves + " moves.  Press Enter to restart puzzle mode or Escape to go back to the main menu", 10, 30);
				if (this.recordMoves == 0 || this.recordMoves > this.numberOfMoves) {
					this.recordMoves = this.numberOfMoves;
				}
			} else {
				ctx.fillText("Player 1 has won the game.  Press Enter to start a new game and Escape to go back to the main menu", 10, 30);
			}
		} else if (this.select == "2") {
			ctx.fillText("Player 2 has won the game.  Press Enter to start a new game and Escape to go back to the main menu", 10, 30);
		}

		for (i = 0; i < this.playerOneNotes.length; i++) {
			if (this.playerOneNotes[i] == 0) {
				this.drawC(ctx,i,1);
			} else if (this.playerOneNotes[i] == 1) {
				this.drawD(ctx,i,1);
			} else if (this.playerOneNotes[i] == 2) {
				this.drawE(ctx,i,1);
			} else if (this.playerOneNotes[i] == 3) {
				this.drawF(ctx,i,1);
			} else if (this.playerOneNotes[i] == 4) {
				this.drawG(ctx,i,1);
			}
		}
		if (this.gameMode == "practice") {
			ctx.save();
			ctx.font = "12pt Arial";
			ctx.fillText("Number of moves: " + this.numberOfMoves,25,250);
			if (this.recordMoves == 0) {
				ctx.fillText("Try to make an ascending scale in as few moves as possible!",25,270);
			} else {
				ctx.fillText("Current record: " + this.recordMoves,25,270);
			}
			ctx.restore();
		} else {
			for (i = 0; i < this.playerTwoNotes.length; i++) {
				if (this.playerTwoNotes[i] == 0) {
					this.drawC(ctx,i,2);
				} else if (this.playerTwoNotes[i] == 1) {
					this.drawD(ctx,i,2);
				} else if (this.playerTwoNotes[i] == 2) {
					this.drawE(ctx,i,2);
				} else if (this.playerTwoNotes[i] == 3) {
					this.drawF(ctx,i,2);
				} else if (this.playerTwoNotes[i] == 4) {
					this.drawG(ctx,i,2);
				}
			}
		}
		for (i = 0; i < this.blocks.length; i++) {
			if (this.blocks[i] < 0) {
				this.drawBlock(ctx,i,this.blocks[i]);
			} else if (this.blocks[i] > 0) {
				this.drawBlock(ctx,i,"+" + this.blocks[i]);
			}
		}
		if (this.displayGhostNotes) {
			for (i = 0; i < this.blocks.length; i++) {
				if (this.blocks[i] != 0) {
					if (this.turn == 1) {
						var ghost = this.playerOneNotes[i] + this.blocks[i];
						if (ghost < 0) {
							ghost += 5;
						} else if (ghost > 4) {
							ghost -= 5;
						}
						if (ghost == 0) {
							this.drawGhostC(ctx,i,1);
						} else if (ghost == 1) {
							this.drawGhostD(ctx,i,1);
						} else if (ghost == 2) {
							this.drawGhostE(ctx,i,1);
						} else if (ghost == 3) {
							this.drawGhostF(ctx,i,1);
						} else if (ghost == 4) {
							this.drawGhostG(ctx,i,1);
						}
					} else {
						var ghost = this.playerTwoNotes[i] + this.blocks[i];
						if (ghost < 0) {
							ghost += 5;
						} else if (ghost > 4) {
							ghost -= 5;
						}
						if (ghost == 0) {
							this.drawGhostC(ctx,i,2);
						} else if (ghost == 1) {
							this.drawGhostD(ctx,i,2);
						} else if (ghost == 2) {
							this.drawGhostE(ctx,i,2);
						} else if (ghost == 3) {
							this.drawGhostF(ctx,i,2);
						} else if (ghost == 4) {
							this.drawGhostG(ctx,i,2);
						}
					}
				}
			}
		}
	},
	drawImage: function(x,y,width,height,opacity,imageURL,ctx) {
		var img = new Image();
		img.onload = function(){
			ctx.globalAlpha = opacity;
			ctx.drawImage(img,x,y,width,height);
			ctx.globalAlpha = 1;
		}
		img.src = imageURL;
	},
	drawBlock: function(ctx,slot,value) {
		if (this.graphicsMode == "letters") {
			ctx.fillText(value, 30+slot*20, 70);
		} else {
			ctx.save();
			ctx.font = "16pt Arial";
			ctx.fillText(value, 91+slot*150, 210);
			ctx.restore();
		}
	},
	drawC: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
				ctx.fillText("C", 30+slot*20, 10+40*player);
		} else {
			var opacity = 1;
			if (player != this.turn) {
				opacity = 0.5;
			}
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnote.jpg",ctx);
				}
			}
		}
	},
	drawD: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
			ctx.fillText("D", 30+slot*20, 10+40*player);
		} else {
			var opacity = 1;
			if (player != this.turn) {
				opacity = 0.5;
			}
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnote.jpg",ctx);
				}
			}
		}
	},
	drawE: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
			ctx.fillText("E", 30+slot*20, 10+40*player);
		} else {
			var opacity = 1;
			if (player != this.turn) {
				opacity = 0.5;
			}
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enote.jpg",ctx);
				}
			}
		}
	},
	drawF: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
			ctx.fillText("F", 30+slot*20, 10+40*player);
		} else {
			var opacity = 1;
			if (player != this.turn) {
				opacity = 0.5;
			}
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnote.jpg",ctx);
				}
			}
		}
	},
	drawG: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
			ctx.fillText("G", 30+slot*20, 10+40*player);
		} else {
			var opacity = 1;
			if (player != this.turn) {
				opacity = 0.5;
			}
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnote.jpg",ctx);
				}
			}
		}
	},
	drawGhostC: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
			//do nothing
		} else {
			var opacity = 0.1;
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/cnote.jpg",ctx);
				}
			}
		}
	},
	drawGhostD: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
		
		} else {
			var opacity = 0.1;
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/dnote.jpg",ctx);
				}
			}
		}
	},
	drawGhostE: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
		
		} else {
			var opacity = 0.1;
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/enote.jpg",ctx);
				}
			}
		}
	},
	drawGhostF: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
		
		} else {
			var opacity = 0.1;
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/fnote.jpg",ctx);
				}
			}
		}
	},
	drawGhostG: function(ctx,slot,player) {
		if (this.graphicsMode == "letters") {
		
		} else {
			var opacity = 0.1;
			if (slot == this.currentSlot && player == 1 && this.currentRow == 0) {
				if (this.mode == "select") {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnoteyellow.jpg",ctx);
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnotegreen.jpg",ctx);
				}
			} else {
				if (slot == this.currentSlot && player == 2 && this.currentRow == 2) {
					if (this.mode == "select") {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnoteyellow.jpg",ctx);
					} else {
						this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnotegreen.jpg",ctx);
					}
				} else {
					this.drawImage(25 + 150*slot,35 + 190*(player-1),150,150,opacity,"images/gnote.jpg",ctx);
				}
			}
		}
	},
	drawTutorial: function(event) {
		this.mode = "tutorial";
		var ctx = noteCanvas.getContext("2d");
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,noteCanvas.width,noteCanvas.height);
		ctx.fillStyle = "#000";
		ctx.save();
		ctx.font = "18pt Arial";
		if (this.tutorialPage == 1) {
			ctx.fillText("Each player starts with a descending scale of notes from G to C.",30,30);
			this.drawImage(25 + 120*0,35,120,120,1,"images/gnote.jpg",ctx);
			this.drawImage(25 + 120*1,35,120,120,1,"images/fnote.jpg",ctx);
			this.drawImage(25 + 120*2,35,120,120,1,"images/enote.jpg",ctx);
			this.drawImage(25 + 120*3,35,120,120,1,"images/dnote.jpg",ctx);
			this.drawImage(25 + 120*4,35,120,120,1,"images/cnote.jpg",ctx);
			ctx.fillText("To win the game, you must rearrange your notes in an ascending",30,175); 
			ctx.fillText("scale (C,D,E,F,G) before your opponent does.  The ascending",30,205);
			ctx.fillText("scale can be in any order.  For example, F,G,C,D,E will win.",30,235);
			this.drawImage(25 + 120*0,240,120,120,1,"images/fnote.jpg",ctx);
			this.drawImage(25 + 120*1,240,120,120,1,"images/gnote.jpg",ctx);
			this.drawImage(25 + 120*2,240,120,120,1,"images/cnote.jpg",ctx);
			this.drawImage(25 + 120*3,240,120,120,1,"images/dnote.jpg",ctx);
			this.drawImage(25 + 120*4,240,120,120,1,"images/enote.jpg",ctx);
			ctx.fillText("Press Enter to continue or Escape to return to the menu",30,380);
		} else if (this.tutorialPage == 2) {
			ctx.fillText("Every turn, you play a note shifter ranging from -2 to +2",30,30);
			ctx.fillText("in an empty slot below one of your notes.",30,60);
			this.drawImage(25 + 120*0,65,120,120,1,"images/gnote.jpg",ctx);
			this.drawImage(25 + 120*1,65,120,120,1,"images/fnote.jpg",ctx);
			this.drawImage(25 + 120*2,65,120,120,1,"images/enote.jpg",ctx);
			this.drawImage(25 + 120*3,65,120,120,1,"images/dnote.jpg",ctx);
			this.drawImage(25 + 120*4,65,120,120,1,"images/cnote.jpg",ctx);
			ctx.font = "14pt Arial";
			ctx.fillText("+2",192,204);
			ctx.strokeStyle = "#00ff00";
			ctx.strokeRect(192,186,24,24);
			ctx.font = "18pt Arial";
			ctx.fillText("For example, this +2 shifter will change the F to a C (F    G    C).",30,229);
			ctx.strokeStyle = "#000";
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(619,222);
			ctx.lineTo(634,222);
			ctx.moveTo(628,216);
			ctx.lineTo(634,222);
			ctx.lineTo(628,228);
			ctx.moveTo(667,222);
			ctx.lineTo(682,222);
			ctx.moveTo(676,216);
			ctx.lineTo(682,222);
			ctx.lineTo(676,228);
			ctx.stroke();
			ctx.lineWidth = 1;
			ctx.fillText("After the shifter changes your note, it will move one slot to the right.",30,259);
			this.drawImage(25 + 120*0,264,120,120,1,"images/gnote.jpg",ctx);
			this.drawImage(25 + 120*1,264,120,120,1,"images/cnote.jpg",ctx);
			this.drawImage(25 + 120*2,264,120,120,1,"images/enote.jpg",ctx);
			this.drawImage(25 + 120*3,264,120,120,1,"images/dnote.jpg",ctx);
			this.drawImage(25 + 120*4,264,120,120,1,"images/cnote.jpg",ctx);
			ctx.font = "14pt Arial";
			ctx.fillText("+2",312,403);
			//ctx.strokeStyle = "#00ff00";
			//ctx.strokeRect(312,385,24,24);
			ctx.strokeStyle = "#000";
			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.moveTo(285,397);
			ctx.lineTo(300,397);
			ctx.moveTo(294,391);
			ctx.lineTo(300,397);
			ctx.lineTo(294,403);
			ctx.stroke();
			ctx.lineWidth = 1;
			ctx.font = "18pt Arial";
			ctx.fillText("Press Enter to continue or Escape to return to the menu",30,440);
			
		} else {
			ctx.fillText("The tutorial is complete.",30,30);
			ctx.fillText("Press Escape to return to the main menu.",30,60);
		}
		ctx.restore();
	},
	drawIntroPage: function(event) {
		this.mode = "intro";
		var ctx = noteCanvas.getContext("2d");
		ctx.lineWidth = 1;
		ctx.fillStyle = "#fff";
		ctx.fillRect(0,0,noteCanvas.width,noteCanvas.height);
		ctx.fillStyle = "#000";
		ctx.save();
		ctx.font = "40pt Arial";
		ctx.fillText("Note War",10,60);
		ctx.font = "20pt Arial";
		ctx.fillText("Tutorial",50,120);
		ctx.fillText("Puzzle Mode (One player)",50,150);
		ctx.fillText("Play against the computer",50,180);
		ctx.fillText("Two player game",50,210);
		ctx.font = "12pt Arial";
		ctx.fillText("Scroll through the choices with up and down and press enter to select",10,270);
		ctx.beginPath();
		ctx.arc(37,110+30*this.currentRow,6,0,2*Math.PI,true);
		ctx.fill();
		ctx.restore();
	},
	introPage: function(event) {
		dojo.empty(this.generateDiv);
		noteCanvas = dojo.doc.createElement('canvas');
		noteCanvas.setAttribute('width',800); 
		noteCanvas.setAttribute('height',800); 
		dojo.place(noteCanvas, this.generateDiv);
		//make duplicates for each note in case up to three notes are played in rapid succession
		this.musicNotes = [];
		this.duplicateNotes = [];
		this.duplicateNotesTwo = [];
		var cNote = dojo.doc.createElement('audio');
		cNote.setAttribute('src', 'sounds/C.mp3');
		this.musicNotes.push(cNote);
		var cNoteTwo = dojo.doc.createElement('audio');
		cNoteTwo.setAttribute('src', 'sounds/C.mp3');
		this.duplicateNotes.push(cNoteTwo);
		var cNoteThree = dojo.doc.createElement('audio');
		cNoteThree.setAttribute('src', 'sounds/C.mp3');
		this.duplicateNotesTwo.push(cNoteThree);
		var dNote = dojo.doc.createElement('audio');
		dNote.setAttribute('src', 'sounds/D.mp3');
		this.musicNotes.push(dNote);
		var dNoteTwo = dojo.doc.createElement('audio');
		dNoteTwo.setAttribute('src', 'sounds/D.mp3');
		this.duplicateNotes.push(dNoteTwo);
		var dNoteThree = dojo.doc.createElement('audio');
		dNoteThree.setAttribute('src', 'sounds/D.mp3');
		this.duplicateNotesTwo.push(dNoteThree);
		var eNote = dojo.doc.createElement('audio');
		eNote.setAttribute('src', 'sounds/E.mp3');
		this.musicNotes.push(eNote);
		var eNoteTwo = dojo.doc.createElement('audio');
		eNoteTwo.setAttribute('src', 'sounds/E.mp3');
		this.duplicateNotes.push(eNoteTwo);
		var eNoteThree = dojo.doc.createElement('audio');
		eNoteThree.setAttribute('src', 'sounds/E.mp3');
		this.duplicateNotesTwo.push(eNoteThree);
		var fNote = dojo.doc.createElement('audio');
		fNote.setAttribute('src', 'sounds/F.mp3');
		this.musicNotes.push(fNote);
		var fNoteTwo = dojo.doc.createElement('audio');
		fNoteTwo.setAttribute('src', 'sounds/F.mp3');
		this.duplicateNotes.push(fNoteTwo);
		var fNoteThree = dojo.doc.createElement('audio');
		fNoteThree.setAttribute('src', 'sounds/F.mp3');
		this.duplicateNotesTwo.push(fNoteThree);
		var gNote = dojo.doc.createElement('audio');
		gNote.setAttribute('src', 'sounds/G.mp3');
		this.musicNotes.push(gNote);
		var gNoteTwo = dojo.doc.createElement('audio');
		gNoteTwo.setAttribute('src', 'sounds/G.mp3');
		this.duplicateNotes.push(gNoteTwo);
		var gNoteThree = dojo.doc.createElement('audio');
		gNoteThree.setAttribute('src', 'sounds/G.mp3');
		this.duplicateNotesTwo.push(gNoteThree);
		this.blockSounds = [];
		this.duplicateBlocks = [];
		this.duplicateBlocksTwo = [];
		var plusOne = dojo.doc.createElement('audio');
		plusOne.setAttribute('src', 'sounds/plusOne.mp3');
		this.blockSounds.push(plusOne);
		var plusOneTwo = dojo.doc.createElement('audio');
		plusOneTwo.setAttribute('src', 'sounds/plusOne.mp3');
		this.duplicateBlocks.push(plusOneTwo);
		var plusOneThree = dojo.doc.createElement('audio');
		plusOneThree.setAttribute('src', 'sounds/plusOne.mp3');
		this.duplicateBlocksTwo.push(plusOneThree);
		var plusTwo = dojo.doc.createElement('audio');
		plusTwo.setAttribute('src', 'sounds/plusTwo.mp3');
		this.blockSounds.push(plusTwo);
		var plusTwoTwo = dojo.doc.createElement('audio');
		plusTwoTwo.setAttribute('src', 'sounds/plusTwo.mp3');
		this.duplicateBlocks.push(plusTwoTwo);
		var plusTwoThree = dojo.doc.createElement('audio');
		plusTwoThree.setAttribute('src', 'sounds/plusTwo.mp3');
		this.duplicateBlocksTwo.push(plusTwoThree);
		var minusOne = dojo.doc.createElement('audio');
		minusOne.setAttribute('src', 'sounds/minusOne.mp3');
		this.blockSounds.push(minusOne);
		var minusOneTwo = dojo.doc.createElement('audio');
		minusOneTwo.setAttribute('src', 'sounds/minusOne.mp3');
		this.duplicateBlocks.push(minusOneTwo);
		var minusOneThree = dojo.doc.createElement('audio');
		minusOneThree.setAttribute('src', 'sounds/minusOne.mp3');
		this.duplicateBlocksTwo.push(minusOneThree);
		var minusTwo = dojo.doc.createElement('audio');
		minusTwo.setAttribute('src', 'sounds/minusTwo.mp3');
		this.blockSounds.push(minusTwo);
		var minusTwoTwo = dojo.doc.createElement('audio');
		minusTwoTwo.setAttribute('src', 'sounds/minusTwo.mp3');
		this.duplicateBlocks.push(minusTwoTwo);
		var minusTwoThree = dojo.doc.createElement('audio');
		minusTwoThree.setAttribute('src', 'sounds/minusTwo.mp3');
		this.duplicateBlocksTwo.push(minusTwoThree);
		this.currentRow = 0;
		this.drawIntroPage();
	},
});
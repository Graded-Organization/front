<template>
	<div>
		<div class="inner boxfix-vert">
			<div class="m-default">

				<!-- <pre>{{ currentToolArea }}</pre> -->
				<!--<pre>{{ hoveredCell }}</pre>-->

				<h2 class="worksheet-title mb-half" contenteditable="true">Untitled Worksheet</h2>


				<div class="grid-wrapper mb-default">
					<div
						class="grid-areas"
						@mousemove="setControl"
						@mouseleave="clearControl"
					>
						<div class="row-buttons">
							<graded-button class="button-primary button-small button-pill" @click.prevent="addRow"><i class="fa fa-fw fa-plus" /></graded-button>
							<graded-button class="button-primary button-small button-pill" @click.prevent="removeRow"><i class="fa fa-fw fa-minus" /></graded-button>
						</div>

						<div class="col-buttons">
							<graded-button class="button-primary button-small button-pill" @click.prevent="addCol"><i class="fa fa-fw fa-plus" /></graded-button>
							<graded-button class="button-primary button-small button-pill" @click.prevent="removeCol"><i class="fa fa-fw fa-minus" /></graded-button>
						</div>

						<div
							attribute="cell"
							id="grid-area"
							class="grid-area"
							:style="gridStyle"
							@keydown.esc="escape"
							tabindex="-1"
						>
							<template v-for="row in rows">
								<worksheet-editor-empty-cell
									v-for="col in columns"
									:col="col-1"
									:row="row-1"
									:data-item="`area${ col-1 }-${ row-1 }`"
									:is-max-col="col-1 == columns-1"
									:is-max-row="row-1 == rows-1"
									:key="`area${ col-1 }-${ row-1 }`"
									class="drag-element"
									:class="{
										'is-selected': isSelected(`area${ col-1 }-${ row-1 }`) && !isOverlaping(`area${ col-1 }-${ row-1 }`),
										'is-forbidden': isSelected(`area${ col-1 }-${ row-1 }`) && isOverlaping(`area${ col-1 }-${ row-1 }`)
									}"
									@mouseover="selectLayer(`area${ col-1 }-${ row-1 }`)"
								/>
							</template>
						</div>

						<div
							class="grid-area grid-area-blocks"
							:class="{
								'free-cells': cellType == 'Free',
								'overlapping-cells': cellType == 'Overlapping'
							}"
							:style="gridAreaStyle"
							:key="updateAreas"
						>
							<template v-for="row in rows">
								<div
									v-for="col in columns"
									:key="`area${ col-1 }-${ row-1 }`"
									v-if="!Object.keys(assignedAreas).includes(`area${ col-1 }-${ row-1 }`)"
									class="cell"
								/>
							</template>

							<worksheet-editor-tool-area
								v-for="cell in Object.values(assignedAreas).filter((v, i, a) => a.indexOf(v) === i)"
								class="tool-area"
								:class="cell"
								:id="cell"
								:key="cell"
								:cells="getToolAreas(cell)"
								@remove="removeArea(cell)"
								@add-tool="addTool(cell)"
								@edit="editToolArea(cell)"
								:style="getToolAreaStyle(cell)"
								@resize-end="resize(cell)"
								:max-cols="columns"
								:max-rows="rows"
								@expand="expand"
							>
							</worksheet-editor-tool-area>
						</div>
					</div>
				</div>


				<p class="text-center">{{ columns }} &times; {{ rows }}</p>

				<div class="form-group text-right">
					<!--<input class="form-control" type="text" v-model="newAreaName">-->
					<graded-button class="button-primary" @click.prevent="setArea">Set Area</graded-button>
				</div>

				<!-- MAP -->

				<!--<div
					class="grid-area"
					style="display: grid;"
					:style="gridStyle"
					:key="updateAreas"
				>
					<template v-for="row in rows">
						<div
							v-for="col in columns"
							:key="`area${ col-1 }-${ row-1 }`"
							style="border: 1px solid #EEE; padding: 10px; text-align: center;"
							:style="!!assignedAreas[`area${col-1}-${row-1}`] ? 'background: #AAA;' : ''"
						>
							<p style="font-size: 0.6rem">{{ col-1 }}, {{ row-1 }}</p>
							<p>{{ assignedAreas[`area${col-1}-${row-1}`] || 'empty' }}</p>
						</div>
					</template>
				</div>-->

				<!--<p class="mb-default">
					<graded-button class="button-primary" @click.prevent="addCol">Add Column</graded-button>
					<graded-button class="button-primary" @click.prevent="removeCol">Remove Column</graded-button>
				</p>

				<p class="mb-default">
					<graded-button class="button-primary" @click.prevent="addRow">Add Row</graded-button>
					<graded-button class="button-primary" @click.prevent="removeRow">Remove Row</graded-button>
				</p>-->

				<!--<p>Selected items:</p>
				<pre>{{ selectedItems }}</pre>

				<p>Assigned Areas:</p>
				<pre>{{ assignedAreas }}</pre>

				<p>Areas:</p>
				<pre>{{ areas }}</pre>

				<pre>{{ Object.values(assignedAreas).filter((v, i, a) => a.indexOf(v) === i) }}</pre>-->
			</div>
		</div>

		<worksheet-editor-drawer
			:show="showEditor"
			@close="closeEditor"
		>
			<worksheet-editor-tool-area-editor
				:key="toolAreaUpdate"
				:tool-area="currentToolArea"
				:value="getToolAreaStyle(currentToolArea)"
				@input="setToolAreaStyle"
			/>
		</worksheet-editor-drawer>
	</div>
</template>

<script>
	import Vue from 'vue';
	import DragSelect from 'dragselect';

	export default {
		name: 'Editor',
		data: () => ({
			showEditor: false,
			cellType: 'Free',
			updateAreas: 0,
			ds: null,
			newAreaName: '',
			selectedItems: [],
			columns: 6,
			rows: 6,
			min: 6,
			areaSelected: false,
			assignedAreas: {},

			// Styles
			toolAreaUpdate: 0,
			currentToolArea: null,
			toolAreas: {},

			//Control
			hoveredCell: [-1, -1]
		}),
		mounted() {

			const obj = this;

			this.ds = new DragSelect({
				area: document.getElementById('grid-area'),
				selectables: document.getElementsByClassName('drag-element'),
				draggability: false,
				immediateDrag: false
			});

			this.ds.subscribe('dragstart', (cObj) => { this.selectCells(cObj.items); });
			this.ds.subscribe('dragmove', (cObj) => { this.selectCells(cObj.items); });
			this.ds.subscribe('callback', (cObj) => { this.selectionOcurred(cObj); });
		},
		computed: {
			areas() {

				let cells = [];

				for(var i = 0; i < this.rows; i++) {

					cells[i] = [];

					for(var j = 0; j < this.columns; j++) {

						let areaName = `area${ j }-${ i }`;

						if(typeof this.assignedAreas[areaName] !== 'undefined') {

							Vue.set(cells[i], j, this.assignedAreas[areaName]);
						} else {

							Vue.set(cells[i], j, areaName);
						}

					}
				}
				return cells;
			},
			cssAreas() {

				let css = '';
				for(const r in this.areas) {
					css = `${css} "${ this.areas[r].join(' ').trim() }"`;
				}

				return css.trim();
			},
			gridStyle() {

				let cols = [];
				let rows = [];

				for(var i = 0; i < this.columns; i++) {
					cols.push('1fr');
				}

				for(var i = 0; i < this.rows; i++) {
					rows.push('1fr');
				}

				return {
					'grid-template-columns': cols.join(' '),
					'grid-template-rows': rows.join(' ')
				}
			},
			gridAreaStyle() {

				let cols = [];
				let rows = [];

				for(var i = 0; i < this.columns; i++) {
					cols.push('1fr');
				}

				for(var i = 0; i < this.rows; i++) {
					rows.push('1fr');
				}

				return {
					'grid-template-areas': this.cssAreas,
					'grid-template-columns': cols.join(' '),
					'grid-template-rows': rows.join(' ')
				}
			}
		},
		methods: {
			expand(area, dir, info) {

				// Check if it can expand
				console.log(info);

				if(dir == 'right' && !info.touchRight) {

					let colToGrab = info.maxPoint[0] + 1;
					let zone = [info.origin[1], info.maxPoint[1]];

					// The area is empty
					if(this.colIsEligible(colToGrab, zone, area)) {
						this.fillColArea(area, colToGrab, zone);
					}
				}

				if(dir == 'left' && !info.touchLeft) {

					let colToGrab = info.origin[0] - 1;
					let zone = [info.origin[1], info.maxPoint[1]];

					// The area is empty
					if(this.colIsEligible(colToGrab, zone, area)) {
						this.fillColArea(area, colToGrab, zone);
					}
				}

				if(dir == 'bottom' && !info.touchBottom) {

					let rowToGrab = info.maxPoint[1] + 1;
					let zone = [info.origin[0], info.maxPoint[0]];

					// The area is empty
					if(this.rowIsEligible(rowToGrab, zone, area)) {
						this.fillRowArea(area, rowToGrab, zone);
					}
				}

				if(dir == 'top' && !info.touchTop) {

					let rowToGrab = info.origin[1] - 1;
					let zone = [info.origin[0], info.maxPoint[0]];

					// The area is empty
					if(this.rowIsEligible(rowToGrab, zone, area)) {
						this.fillRowArea(area, rowToGrab, zone);
					}
				}

				this.columns++;
				this.columns--;
			},
			getAreaSize(area) {

				let origin = this.getOriginPoints(area);
				let maxPoints = this.getMaxPoints(area);

				return [
					(maxPoints[0] + 1) - Math.max(0, origin[0]),
					(maxPoints[1] + 1) - Math.max(0, origin[1])
				];
			},
			getOriginPoints(area) {

				let cells = this.getToolAreas(area);

				let x = this.columns;
				let y = this.rows;

				for(const c in cells) {
					x = Math.min(x, cells[c][0]);
					y = Math.min(y, cells[c][1]);
				}

				return [x, y];
			},
			getMaxPoints(area) {

				let cells = this.getToolAreas(area);

				let x = 0;
				let y = 0;

				for(const c in cells) {
					x = Math.max(x, cells[c][0]);
					y = Math.max(y, cells[c][1]);
				}

				return [x, y];
			},
			getAdjacentCol(col, zone, area) {
				let adjacent = [];

				console.group('getAdjacentCol');
				console.log(col, zone, area);

				for(var i = zone[0]; i <= zone[1]; i++) {

					//Check all the adjacent areas
					if(this.areas[i][col].includes('tool-area')) {

						adjacent.push(this.areas[i][col]);
					}
				}

				adjacent = adjacent.filter((v, i, a) => a.indexOf(v) === i);

				console.groupEnd();
				return adjacent;
			},
			colIsEligible(col, zone, area) {

				let adjacent = this.getAdjacentCol(col, zone, area);

				// If there is no adjacent areas then it's empty, so it can be used
				if(!adjacent.length) {

					return true;

				//If there are adjacent areas, we need to check a little more.
				} else {

					console.log('Adjacents in COL', adjacent);

					for(const a in adjacent) {

						// if the width of the adjacent area is less than 2,
						// then it can be robbed of a col because it would get zero as area
						if(this.getAreaSize(adjacent[a])[0] < 2) {

							return false;
						}
					}
				}

				return true;
			},
			fillColArea(area, col, zone) {
				/*for(var i = zone[0]; i <= zone[1]; i++) {
					Vue.set(this.assignedAreas, `area${col}-${i}`, area);
				}*/
				let adjacent = this.getAdjacentCol(col, zone, area);
				console.log('Adjacent in FillColArea', adjacent);

				for(var row = 0; row < this.rows; row++) {
					if(typeof this.assignedAreas[`area${col}-${row}`] !== 'undefined' && adjacent.includes(this.assignedAreas[`area${col}-${row}`])) {
						Vue.delete(this.assignedAreas, `area${col}-${row}`);
					}
				}

				for(var i = zone[0]; i <= zone[1]; i++) {
					Vue.set(this.assignedAreas, `area${col}-${i}`, area);
				}
			},
			getAdjacentRow(row, zone, area) {
				let adjacent = [];

				for(var i = zone[0]; i <= zone[1]; i++) {

					//Check all the adjacent areas
					if(this.areas[row][i].includes('tool-area')) {

						adjacent.push(this.areas[row][i]);
					}
				}

				adjacent = adjacent.filter((v, i, a) => a.indexOf(v) === i);
				return adjacent;
			},
			rowIsEligible(row, zone, area) {

				let adjacent = this.getAdjacentRow(row, zone, area);

				// If there is no adjacent areas then it's empty, so it can be used
				if(!adjacent.length) {

					return true;

				//If there are adjacent areas, we need to check a little more.
				} else {

					for(const a in adjacent) {

						// if the height of the adjacent area is less than 2,
						// then it can be robbed of a row because it would get zero as area
						if(this.getAreaSize(adjacent[a])[1] < 2) {

							return false;
						}
					}
				}

				return true;
			},
			fillRowArea(area, row, zone) {

				let adjacent = this.getAdjacentRow(row, zone, area);
				console.log('Adjacent in FillRowArea', adjacent);

				for(var col = 0; col < this.columns; col++) {
					if(typeof this.assignedAreas[`area${col}-${row}`] !== 'undefined' && adjacent.includes(this.assignedAreas[`area${col}-${row}`])) {
						Vue.delete(this.assignedAreas, `area${col}-${row}`);
					}
				}

				for(var i = zone[0]; i <= zone[1]; i++) {
					Vue.set(this.assignedAreas, `area${i}-${row}`, area);
				}
			},
			resize() {
				console.log('Resize end', this.hoveredCell);
			},
			clearControl(e) {
				Vue.set(this, 'hoveredCell', [-1, -1]);
			},
			setControl(e) {

				let gridAreas = document.querySelector('.grid-areas');

				let currentCol = -1;
				let currentRow = -1;

				let rect = gridAreas.getBoundingClientRect();
				let x = e.clientX - rect.left; //x position within the element.
				let y = e.clientY - rect.top;  //y position within the element.

				let colRanges = [];
				let colSize = Math.round(gridAreas.offsetWidth/this.columns);

				let rowRanges = [];
				let rowSize = Math.round(gridAreas.offsetHeight/this.rows);

				// Setting column ranges
				for(var i = 0; i < this.columns; i++) {
					colRanges.push([colSize*i, (colSize*(i+1)) - 1]);
				}

				for(const col in colRanges) {
					if(x >= colRanges[col][0] && x <= colRanges[col][1]) {

						currentCol = col;
						break;
					}
				}

				// Setting row ranges
				for(var i = 0; i < this.rows; i++) {
					rowRanges.push([rowSize*i, (rowSize*(i+1)) - 1]);
				}

				for(const row in rowRanges) {
					if(y >= rowRanges[row][0] && y <= rowRanges[row][1]) {

						currentRow = row;
						break;
					}
				}

				Vue.set(this, 'hoveredCell', [currentCol, currentRow]);
			},
			getToolAreas(area) {

				let cells = [];

				for(const a in this.assignedAreas) {

					if(this.assignedAreas[a] == area) cells.push([
						a.replace('area', '').split('-')[0],
						a.replace('area', '').split('-')[1]
					]);
				}

				return cells;
			},
			editToolArea(area) {

				this.currentToolArea = null;
				this.currentToolArea = area;

				if(typeof this.toolAreas[area] === 'undefined') {
					Vue.set(this.toolAreas, area, {});
				}

				this.showEditor = true;
				this.toolAreaUpdate++;
			},
			closeEditor() {

				this.currentToolArea = null;
				this.showEditor = false;
			},
			removeArea(cell) {

				for(const i in this.assignedAreas) {
					if(this.assignedAreas[i] == cell) {
						delete this.assignedAreas[i];
					}
				}

				delete this.toolAreas[cell];

				this.currentToolArea = null;
				this.showEditor = false;

				this.columns++;
				this.columns--;
			},
			selectLayer(cell) {
				let cellType = this.isOverlaping(cell) ? 'Overlapping' : 'Free';
				this.cellType = cellType;
			},
			selectCells(cells) {
				let items = [];

				for(const i in cells) {
					items.push(cells[i].dataset.item);
				}
				Vue.set(this, 'selectedItems', items);
			},
			isSelected(cls) {
				return this.selectedItems.includes(cls);
			},
			isOverlaping(cls) {
				return Object.keys(this.assignedAreas).includes(cls);
			},
			reset() {
				const obj = this;
				this.ds.stop();
				this.ds.start();
				setTimeout(function() {
					obj.ds.addSelectables(document.getElementsByClassName('drag-element'), true);
				}, 100);
			},
			addCol() {
				this.columns++;
				this.reset();
			},
			addRow() {
				this.rows++;
				this.reset();
			},
			removeCol() {

				// Checking if any tool area is inside the row to be removed

				for(const item in this.assignedAreas) {

					let col = item.replace('area', '').split('-')[0];

					if(col == this.columns-1) {

						alert('Cannot remove column because there are tools in the column');
						return;
					}
				}

				if(this.columns > 6) this.columns--;
				this.reset();
			},
			removeRow() {

				// Checking if any tool area is inside the row to be removed

				for(const item in this.assignedAreas) {

					let row = item.replace('area', '').split('-')[1];

					if(row == this.rows-1) {

						alert('Cannot remove row because there are tools in the row');
						return;
					}
				}


				if(this.rows > 6) this.rows--;
				this.reset();
			},
			selectionOcurred(cObj) {
				this.selectCells(cObj.items);


				for(const c in this.selectedItems) {
					if(this.isOverlaping(this.selectedItems[c])) {
						alert('Boxes overlapping, no good');
						Vue.set(this, 'selectedItems', []);
						this.newAreaName = '';
						this.areaSelected = false;
						return;
					}
				}

				this.currentToolArea = null;
				this.showEditor = false;
				this.areaSelected = true;
			},
			escape() {
				Vue.set(this, 'selectedItems', []);
				this.newAreaName = '';
				this.areaSelected = false;
				return;
			},
			addTool(cell) {
				console.log(cell);
			},
			getToolAreaStyle(area) {

				if(!area) return {};

				let styles = { 'grid-area': area };

				if(typeof this.toolAreas[area] !== 'undefined') {

					styles = {...styles, ...(this.toolAreas[area]?.styles || {})};
				}

				return styles;
			},
			setToolAreaStyle(styles) {
				if(this.currentToolArea) {
					Vue.set(this.toolAreas[this.currentToolArea], 'styles', styles);
				}
			},
			setArea() {
				this.updateAreas++;

				for(const s in this.selectedItems) {
					this.assignedAreas[this.selectedItems[s]] = this.newAreaName || `tool-area-${ this.updateAreas }`;
				}

				this.ds.clearSelection();
				this.columns++;
				this.columns--;

				Vue.set(this, 'selectedItems', []);
				this.newAreaName = '';
				this.areaSelected = false;

				this.reset();
			}
		}
	}
</script>

<style lang="less" scoped>

	.worksheet-title {

		font-size: @font-size-4;
		outline: none;
	}

	.cell {

		user-select: none;
		min-height: 50px;
		display: flex;
		align-items: center;
		justify-content: center;

		&.is-selected { background: @blue-1; }
		&.is-forbidden { background: @red-1; }

		&.drag-element {

			&:hover:not(.is-selected) { background: @gray-1; }
			&:hover:is(.is-selected) { background: @blue-2; }
		}

		&.tool-area {

			aspect-ratio: auto;
		}
	}


	.grid-wrapper {

		.comb;
		border-radius: @component-border-radius;
		position: relative;
		box-shadow: @-shadow-3;

		.grid-area {

			display: grid;

			&.grid-area-blocks {

				.overlay-element();
			}

			&.free-cells { pointer-events: none; }
			&.overlapping-cells { pointer-events: auto; }
		}

		&:hover {

			.row-buttons, .col-buttons {
				opacity: 1;
				pointer-events: all;
			}
		}
	}

	.row-buttons {

		position: absolute;
		bottom: -38px/2;
		text-align: center;
		width: 80px;
		left: 50%;
		margin-left: -40px;
		z-index: 100;
		opacity: 0;
		transition: opacity 500ms;
		pointer-events: none;
	}

	.col-buttons {

		position: absolute;
		right: -35px/2;
		z-index: 100;
		width: 35px;
		top: 50%;
		margin-top: -86px/2;
		opacity: 0;
		transition: opacity 500ms;
		pointer-events: none;

		.button {

			margin: @margin-half 0;
		}
	}

</style>
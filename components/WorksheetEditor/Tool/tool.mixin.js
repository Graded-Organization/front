import { mapGetters, mapActions } from 'vuex';

export default {
	watch: {
		block: {
			handler(n, o) {

				if(!o) return;

				this.blockUpdateKey = Math.floor(Date.now() / 1000);
				this.save();
			},
			deep: true
		}
	},
	props: {
		value: {
			type: Object,
			required: true,
			source: null
		}
	},
	data: () => ({
		block: null,
		blockUpdateKey: 0
	}),
	mounted() { this.block = this.$shallow(this.value); },
	computed: {
		...mapGetters({
			worksheet: 'worksheet/worksheet',
			loading: 'worksheet/loading',
			currentBlock: 'worksheet/currentBlock',
			currentBlockArea: 'worksheet/currentBlockArea',
		}),
		contrastColor() {
			if(this.value.styles?.backgroundColor) {
				return this.$contrastColor(this.value.styles?.backgroundColor);
			}

			return '';
		},
		isCurrentBlock() {

			return this.block?.id == this.currentBlock?.id;
		}
	},
	methods: {
		...mapActions({
			setLoading: 'worksheet/setLoading',
			updateBlock: 'worksheet/updateBlock'
		}),
		async save() {

			if(!!this.source) this.source.cancel('User saved again');
			this.source = this.$axios.CancelToken.source();

			this.setLoading(true);
			await this.$axios.$put(`worksheet-blocks/${ this.block.id }`, this.block, {
				cancelToken: this.source.token
			});
			this.updateBlock(this.$shallow(this.block));

			this.setLoading(false);
		}
	},
}
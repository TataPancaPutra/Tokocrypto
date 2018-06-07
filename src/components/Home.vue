<template>
	<div>
		<p style="position: relative;">Tokocash: {{ formatPrice(cash) }}
			<button id="view-asset-btn" @click="viewAsset" type="button" class="btn btn-success">View Asset</button>
		</p>
		<vue-good-table
			title="Crypto Currency List"
			:columns="columns"
			:rows="rows"
			:sort-options="{
				enabled: true,
				initialSortBy: {field: 'rank', type: 'asc'}
			}"
	      	:pagination-options="{ enabled: true, perPage: 10 }"
	      	@on-row-click="onRowClick"
	  		styleClass="vgt-table bordered striped condensed" />
	</div>
</template>

<style scoped>
#view-asset-btn {
  	font-family: 'Segoe UI', Helvetica, 'Droid Sans', Tahoma, Geneva, sans-serif;
    position: absolute;
	top: -7px;
    right: 0;
    margin: 0;
}

.btn {
    display: inline-block;
    font-weight: normal;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    border: 1px solid transparent;
    margin: 0 0.5rem;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    line-height: 1.25;
    border-radius: 0.25rem;
    transition: all 0.15s ease-in-out;
}

.btn-success {
    color: #fff;
    background-color: #28a745;
    border-color: #28a745;
}

.btn-success:hover {
    background-color: #218838;
    border-color: #1e7e34;
}
</style>

<script>
	import swal from 'sweetalert2'

	export default {
		data () {
			return {
				columns: [
					{ label: 'Rank', field: 'rank', width: '50px', type: 'number', filterOptions: { enabled: true } },
					{ label: 'Name', field: 'name', filterOptions: { enabled: true } },
					{ label: 'Symbol', field: 'symbol', filterOptions: { enabled: true } },
					{ label: 'Price (IDR)', field: 'quotes.IDR.price', type: 'number', filterOptions: { enabled: true }, formatFn: this.formatPrice },
					{ label: 'Volume (24 hours)', field: 'quotes.IDR.volume_24h', type: 'number', filterOptions: { enabled: true } },
					{ label: 'Changing (24 hours)', field: 'quotes.IDR.percent_change_24h', type: 'number', filterOptions: { enabled: true }, formatFn: this.formatPercentage },
				],
				rows: [],
				cash: 10000000,
				assets: [],
			};
		},
	    methods: {
	    	loading() {
	    		const me = this;
	    		me.getData();
	    		setInterval(function() { me.getData(); }, 5*60*1000);
	    	},
	        getData() {
	            this.axios.get('https://api.coinmarketcap.com/v2/ticker/?convert=IDR&limit=100')
	            .then(function(response) {
                	this.rows = Object.values(response.data.data);
	            }.bind(this));
	        },
	        formatPrice(value) {
		        let val = (value/1).toFixed(2).replace('.', ',');
		        return 'Rp. ' + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	        },
	        formatPercentage(value) {
	        	return value + '%';
	        },
	        currentPrice(current) {
	        	var index = this.rows.findIndex((item => item.id == current.id));
	        	if (index == -1)
	        		return 0;

        		return this.rows[index].quotes.IDR.price;
	        },
	        viewAsset() {
	        	var dataToDisplay = {
	        		html: this.displayAssets(),
	        	};

	        	if (this.assets.length == 0)
	        		dataToDisplay.type = "info";

	        	swal(dataToDisplay);
	        },
	        displayAssets() {
	        	if (this.assets.length == 0)
	        		return "You have no asset";

	        	const me = this;
	        	var totalPrice = 0;
	        	var result = 
    			"<p style='text-align: left;'>Asset Under Management:</p>" + 
    				"<table class='vgt-table bordered striped condensed'><tbody>" + 
    					"<tr><td>Name</td><td>Unit</td><td>Price</td></tr>";
	        	
	        	this.assets.forEach(function(asset) {
	        		var price = me.currentPrice(asset) * asset.unit;
	        		totalPrice += price;
	        		result += "<tr><td>" + asset.name + "</td><td>" + asset.unit + "</td><td>" + me.formatPrice(price) + "</td></tr>";
				});
	        	
	        	result += "<tr><td colspan='2' style='text-align: right; font-weight: bold;'>Total</td><td>" + me.formatPrice(totalPrice) + "</td></tr>";
	        	result += "</tbody></table>";
	        	return result;
	        },
	        findAssets(current) {
	        	return this.assets.findIndex((asset => asset.id == current.id));
	        },
	        onRowClick(params) {
	        	var data = params.row;
	        	var assetIndex = this.findAssets(data);
	        	
	        	swal({
					title: data.name + "<br>(" + this.formatPrice(data.quotes.IDR.price) + ")",
					html: this.displayAssets(),
					type: "question",
					showCloseButton: true,
					showConfirmButton: this.cash > 0,
					confirmButtonText: "Invest",
					showCancelButton: assetIndex != -1,
					cancelButtonText: "Redeem",
					cancelButtonColor: "#3085d6",
				}).then((result) => {
					var action = result.value ? "invest" : result.dismiss == "cancel" ? "redeem" : null;
					if (action != null) {
						swal.mixin({
							input: "text",
							confirmButtonText: "Next &rarr;",
							showCancelButton: true,
							progressSteps: ["1", "2"]
						}).queue([
							{
								title: action == "invest" ? "Top Up Nominal" : "Redemption Nominal",
								text: "Please enter the nominal you want to " + action + " in IDR"
							},
							{
								title: "Verification",
								text: "Please enter your PIN",
								input: "password"
							}
						]).then((result) => {
							if (result.value) {
								var nominal = parseFloat(result.value[0]);
								if (result.value[1].trim() == "") {
									swal(
										"Invalid Password",
										"Password must not be empty",
										"error"
									);
								}
								else if (isNaN(nominal)) {
									swal(
										"Something went wrong",
										"Please enter a valid nominal",
										"error"
									);
								}
								else if (action == "invest") {
									// INVEST
									nominal = parseFloat(nominal.toFixed(2));
									if (this.cash < nominal) {
										swal( "Oopss!", "Insufficient balance of your cash", "error");
										return;
									}

									this.cash -= nominal;
									var gainedUnit = nominal / data.quotes.IDR.price;
									if (assetIndex == -1) {
										// add new assets
										this.assets.push({ id: data.id, name: data.name, unit: gainedUnit });
									}
									else {
										// update existing assets
										this.assets[assetIndex].unit += gainedUnit;
									}

									swal("Congratulation!", "Success to invest " + gainedUnit + " unit(s) for " + data.name, "success");
								}
								else {
									// REDEEM
									nominal = parseFloat(nominal.toFixed(2));
									var assetPrice = this.assets[assetIndex].unit * data.quotes.IDR.price;
									assetPrice = parseFloat(assetPrice.toFixed(2));
									if (assetPrice < nominal) {
										swal("Oopss!", "Insufficient unit to redeem", "error");
										return;
									}
									
									this.cash += nominal;
									var redeemedUnit = nominal / data.quotes.IDR.price;
									if (assetPrice == nominal) {
										// remove zero unit/price from assets
										this.assets.splice(assetIndex, 1);
									}
									else {
										// update existing assets
										this.assets[assetIndex].unit -= redeemedUnit;
									}

									swal("Congratulation!", "Success to redeem " + redeemedUnit + " unit(s) for " + data.name, "success");
								}
							}
						});
					}
						
				});
	        }
	    },
	    beforeMount() {
	    	this.loading();
		},
	}
</script>
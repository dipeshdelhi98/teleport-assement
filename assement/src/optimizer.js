/**
 * Solves the Multi-Dimensional Knapsack Problem using Bitmask DP.
 * Constraints: N <= 22.
 */
class OptimizerService {
    optimize(truck, orders) {
      // 1. Group orders: Must have same (Origin, Destination) AND same Hazmat status
      const groups = {};
  
      for (const order of orders) {
        // Compatibility: Same Origin/Dest
        const routeKey = `${order.origin}|${order.destination}`;
        // Compatibility: Same Hazmat status (cannot mix hazmat and non-hazmat)
        const hazmatKey = order.is_hazmat ? 'hazmat' : 'non_hazmat';
        const key = `${routeKey}|${hazmatKey}`;
  
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(order);
      }
  
      let bestResult = this._createEmptyResult(truck);
  
      // 2. Run DP for each compatible group
      for (const key in groups) {
        const group = groups[key];
        const result = this._solveGroup(truck, group);
        
        if (result.total_payout_cents > bestResult.total_payout_cents) {
          bestResult = result;
        }
      }
  
      return bestResult;
    }
  
    /**
     * Bitmask DP for a specific compatible subset of orders.
     * Complexity: O(2^N) where N is group size.
     */
    _solveGroup(truck, orders) {
      const n = orders.length;
      const limit = 1 << n; // 2^n
  
      // Arrays to store accumulated sums for each mask
      // Using standard arrays is fast enough for N=22 (4.2M items)
      const sumW = new Array(limit).fill(0);
      const sumV = new Array(limit).fill(0);
      const sumRev = new Array(limit).fill(0);
  
      let bestRevenue = 0;
      let bestMask = 0;
  
      // Iterate from 1 to 2^n - 1
      for (let mask = 1; mask < limit; mask++) {
        // Get lowest set bit: mask & -mask
        const lsb = mask & -mask;
        // Index of the lsb (0-based)
        const itemIndex = (Math.log2(lsb) | 0); 
        
        const prevMask = mask ^ lsb;
  
        const newWeight = sumW[prevMask] + orders[itemIndex].weight_lbs;
        const newVol = sumV[prevMask] + orders[itemIndex].volume_cuft;
  
        // Pruning: If constraints violated, we stop calculating this mask.
        // Note: In a simple DP iteration, we just skip updating "best", 
        // but valid sums are still stored for superset calculation if we weren't pruning.
        // Since we are doing subset-sum via DP recurrence, we must ensure we don't use invalid masks as "prev".
        // However, the recurrence `prev = mask ^ lsb` is always smaller. 
        // To prevent "poisoning" the DP table where invalid masks feed valid masks, we must check constraints 
        // and only update the sums if valid.
        
        if (newWeight <= truck.max_weight_lbs && newVol <= truck.max_volume_cuft) {
          sumW[mask] = newWeight;
          sumV[mask] = newVol;
          sumRev[mask] = sumRev[prevMask] + orders[itemIndex].payout_cents;
  
          if (sumRev[mask] > bestRevenue) {
            bestRevenue = sumRev[mask];
            bestMask = mask;
          }
        }
      }
  
      // Reconstruct the order IDs from the bestMask
      const selectedIds = [];
      let tempMask = bestMask;
      while (tempMask > 0) {
        const lsb = tempMask & -tempMask;
        const idx = (Math.log2(lsb) | 0);
        selectedIds.push(orders[idx].id);
        tempMask ^= lsb;
      }
  
      return {
        truck_id: truck.id,
        selected_order_ids: selectedIds,
        total_payout_cents: bestRevenue,
        total_weight_lbs: bestRevenue > 0 ? sumW[bestMask] : 0,
        total_volume_cuft: bestRevenue > 0 ? sumV[bestMask] : 0,
      };
    }
  
    _createEmptyResult(truck) {
      return {
        truck_id: truck.id,
        selected_order_ids: [],
        total_payout_cents: 0,
        total_weight_lbs: 0,
        total_volume_cuft: 0,
      };
    }
  
    formatResult(result, truck) {
      const utilW = truck.max_weight_lbs > 0 
        ? (result.total_weight_lbs / truck.max_weight_lbs) * 100 
        : 0;
      const utilV = truck.max_volume_cuft > 0 
        ? (result.total_volume_cuft / truck.max_volume_cuft) * 100 
        : 0;
  
      return {
        ...result,
        utilization_weight_percent: parseFloat(utilW.toFixed(2)),
        utilization_volume_percent: parseFloat(utilV.toFixed(2))
      };
    }
  }
  
  module.exports = new OptimizerService();
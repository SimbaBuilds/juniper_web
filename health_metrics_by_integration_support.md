# Health Metrics Daily - Support by Integration

This document groups the `health_metrics_daily` table metrics by which wearables integrations support them.

## Metrics Supported by ALL Integrations
These core metrics are available from Apple Health, Google Health Connect, Oura Ring, and Fitbit:

- **sleep_score** - Overall sleep quality score (0-100)
- **activity_score** - Daily activity performance score (0-100)
- **readiness_score** - Body's readiness for physical activity (0-100)
- **total_steps** - Total steps taken during the day
- **calories_burned** - Total calories burned
- **resting_hr** - Resting heart rate (bpm)

## Metrics Supported by Most Integrations

### Supported by Apple Health, Google Health Connect, Oura Ring, and Fitbit Premium
- **hrv_avg** - Average heart rate variability (ms)
  - Note: Fitbit requires Premium subscription for HRV data

### Supported by Apple Health, Google Health Connect, and Fitbit
- **weight** - Body weight measurement
- **height** - Height measurement
  - Note: Oura Ring does not have built-in weight/height tracking (uses profile data only)

### Supported by Apple Health, Google Health Connect, Oura Ring, and Fitbit Premium
- **stress_level** - Daily stress measurement
  - Apple Health: Derived from HRV and mindfulness minutes
  - Google Health Connect: Stress tracking from Pixel Watch
  - Oura Ring: Daytime stress feature (Gen 3+)
  - Fitbit: Stress Management Score (Premium feature)

## Metrics with Variable Support

### recovery_score
**Full Support:**
- Oura Ring (native Recovery Index as part of Readiness contributors)

**Derived/Calculated Support:**
- Apple Health (calculated from HRV trends and activity patterns)
- Google Health Connect (derived from recovery metrics)
- Fitbit (calculated from sleep and HRV data, Premium users)

### resilience_score
**Full Support:**
- Oura Ring (Resilience feature for long-term stress adaptation)

**Derived/Calculated Support:**
- Apple Health (calculated from HRV baseline and trends)
- Google Health Connect (derived from stress and recovery patterns)
- Fitbit (calculated from Stress Management trends, Premium users)

## Integration-Specific Capabilities Summary

### 🍎 Apple Health / Apple Watch
**Strengths:**
- Comprehensive ecosystem integration
- Automatic data from iPhone and Apple Watch
- Third-party app data aggregation via HealthKit

**Limitations:**
- Recovery and resilience scores are derived, not native
- Stress level is indirect (from HRV and mindfulness)

### 🤖 Google Health Connect / Pixel Watch
**Strengths:**
- Wide Android device compatibility
- Integration with multiple Wear OS devices
- Unified data from various fitness apps

**Limitations:**
- Recovery and resilience scores are calculated
- Newer platform with evolving metrics

### 💍 Oura Ring
**Strengths:**
- Most comprehensive native scores (all metrics fully supported)
- Detailed recovery and resilience tracking
- Advanced sleep and HRV analysis
- Temperature deviation tracking (not in unified metrics)

**Limitations:**
- No native weight/height tracking (manual entry only)
- Requires ring hardware

### 💪 Fitbit
**Strengths:**
- Extensive activity and exercise tracking
- Nutrition and hydration monitoring
- Weight management features with smart scales
- Large food database

**Limitations:**
- HRV requires Premium subscription
- Advanced stress metrics require Premium
- Recovery/resilience scores are derived

## Data Quality Notes

1. **Native vs. Derived Metrics**
   - Native: Directly measured or calculated by the device/platform
   - Derived: Calculated from other available metrics in our backend

2. **Subscription Requirements**
   - Fitbit Premium required for: HRV data, advanced stress metrics, detailed sleep insights
   - Other platforms include all metrics in base offering

3. **Device Requirements**
   - Apple: Apple Watch required for most health metrics (iPhone provides steps)
   - Google: Pixel Watch or compatible Wear OS device recommended
   - Oura: Oura Ring required (no app-only tracking)
   - Fitbit: Fitbit device required (limited phone-only tracking)

4. **Data Freshness**
   - Real-time: Steps, calories (during day)
   - Daily aggregation: All scores (sleep, activity, readiness)
   - Delayed: Recovery and resilience scores (require multiple days of data)

## Unified Metrics Table Fields

| Metric | Apple Health | Google Health | Oura Ring | Fitbit | Notes |
|--------|--------------|---------------|-----------|---------|--------|
| sleep_score | ✅ | ✅ | ✅ Native | ✅ | Oura provides most detailed sleep analysis |
| activity_score | ✅ | ✅ | ✅ Native | ✅ | All platforms have native activity scoring |
| readiness_score | ✅ | ✅ | ✅ Native | ✅ | Oura's signature metric, others approximate |
| stress_level | ✅ Indirect | ✅ | ✅ Native | ✅ Premium | Variable measurement methods |
| recovery_score | ✅ Derived | ✅ Derived | ✅ Native | ✅ Derived | Oura has native Recovery Index |
| resilience_score | ✅ Derived | ✅ Derived | ✅ Native | ✅ Derived | Oura tracks long-term adaptation |
| total_steps | ✅ | ✅ | ✅ | ✅ | Universal metric |
| calories_burned | ✅ | ✅ | ✅ | ✅ | Universal metric |
| resting_hr | ✅ | ✅ | ✅ | ✅ | Universal metric |
| hrv_avg | ✅ | ✅ | ✅ | ✅ Premium | Fitbit requires subscription |
| weight | ✅ | ✅ | ❌ Manual only | ✅ | Oura stores in profile, not tracked |
| height | ✅ | ✅ | ❌ Manual only | ✅ | Oura stores in profile, not tracked |

Legend:
- ✅ Full support
- ✅ Native - Native measurement/calculation by platform
- ✅ Derived - Calculated from other metrics
- ✅ Premium - Requires premium subscription
- ✅ Indirect - Measured indirectly through other features
- ❌ Manual only - No automatic tracking, manual entry only
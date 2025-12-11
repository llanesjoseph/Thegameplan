import { seedComprehensiveData } from './comprehensive-sample-data'
import { seedAdvancedData } from './advanced-sample-data'

async function masterSeed() {
  console.log("🚀 Starting Master Database Seeding...")
  console.log("================================================")

  try {
    // Run comprehensive data seeding first
    await seedComprehensiveData()

    console.log("\n" + "=".repeat(50))

    // Run advanced data seeding
    await seedAdvancedData()

    console.log("\n" + "=".repeat(50))
    console.log("🎉 MASTER SEEDING COMPLETED SUCCESSFULLY!")
    console.log("================================================")
    console.log("\n📊 COMPLETE DATA SUMMARY:")
    console.log("👥 USERS:")
    console.log("  • 5 Athletes (regular users)")
    console.log("  • 5 Creators (approved coaches)")
    console.log("  • 5 Admins (platform staff)")
    console.log("  • 3 Superadmins (auto-provisioned)")
    console.log("\n📋 PROFILES:")
    console.log("  • 5 Detailed user profiles")
    console.log("  • Complete expertise & goal tracking")
    console.log("\n🎬 CONTENT:")
    console.log("  • 5 Lessons across all sports")
    console.log("  • Professional quality metadata")
    console.log("  • Pricing & difficulty levels")
    console.log("\n💬 INTERACTIONS:")
    console.log("  • 5 Coaching requests (various statuses)")
    console.log("  • 5 Contributor applications")
    console.log("  • 5 Notifications (all types)")
    console.log("\n📊 ANALYTICS:")
    console.log("  • 4 Creator performance reports")
    console.log("  • 3 User progress tracking")
    console.log("  • 5 Event tracking samples")
    console.log("\n🎯 READY FOR TESTING:")
    console.log("  ✅ Complete user journeys")
    console.log("  ✅ Creator workflows")
    console.log("  ✅ Admin management")
    console.log("  ✅ Analytics & reporting")
    console.log("  ✅ Real-world scenarios")
    console.log("\n🔑 LOGIN CREDENTIALS:")
    console.log("Athletes: alex.johnson@email.com, sarah.martinez@email.com, etc.")
    console.log("Creators: coach.rodriguez@email.com, coach.thompson@email.com, etc.")
    console.log("Admins: admin.smith@gameplan.com, admin.davis@gameplan.com, etc.")
    console.log("Superadmins: Auto-provision on sign-in")

  } catch (error) {
    console.error("❌ Error during master seeding:", error)
    throw error
  }
}

// Run if executed directly
masterSeed().catch(console.error)
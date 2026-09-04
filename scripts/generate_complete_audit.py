import sys
import os

from audit_generators.sec1_repo_map import generate_section_1
from audit_generators.sec2_pages_screens import generate_section_2
from audit_generators.sec3_components import generate_section_3
from audit_generators.sec4_api_routes import generate_section_4
from audit_generators.sec5_business_engines import generate_section_5
from audit_generators.sec6_database import generate_section_6
from audit_generators.sec7_auth_security import generate_section_7
from audit_generators.sec8_app_flows import generate_section_8
from audit_generators.sec9_testing_quality import generate_section_9
from audit_generators.sec10_internal_audit_check import generate_section_10
from audit_generators.sec11_verdict_and_matrix import generate_section_11

def main():
    report_path = "AUDIT_REPORT.md"
    print("Generating comprehensive AUDIT_REPORT.md...")
    
    toc = """# SOLARGRID — FULL PRODUCTION AUDIT & CODEBASE SPECIFICATION REPORT

**Project Name:** SolarGrid — Digital Solar Infrastructure Platform (Next.js 14 + Supabase)  
**Audit Classification:** Full-Scope Production Readiness, Architecture, Security, and Codebase Verification  
**Date of Audit:** September 1, 2026  
**Auditor:** Senior Staff Software Auditor & Principal Security Reviewer  
**Status:** Comprehensive Audit Completed  

---

## TABLE OF CONTENTS

1. [Full Repository Map](#1-full-repository-map)
   - [1.1 Complete Folder and File Tree](#11-complete-folder-and-file-tree)
   - [1.2 Tech Stack Inventory](#12-tech-stack-inventory)
   - [1.3 Build and Configuration Audit](#13-build-and-configuration-audit)
   - [1.4 Environment Variable (.env) Audit](#14-environment-variable-env-audit)
2. [Every Page / Screen (All 61 Routes under `app/`)](#2-every-page--screen-all-61-routes-under-app)
   - [2.1 Public Marketing & Educational Screens](#21-public-marketing--educational-screens)
   - [2.2 Authentication & Account Recovery Screens](#22-authentication--account-recovery-screens)
   - [2.3 Member Dashboard Screens (`app/dashboard/*`)](#23-member-dashboard-screens-appdashboard)
   - [2.4 Super Admin Console Screens (`app/admin/*`)](#24-super-admin-console-screens-appadmin)
3. [Every Reusable Component (`components/*`)](#3-every-reusable-component-components)
   - [3.1 Glass Design System Components (`components/glass/*`)](#31-glass-design-system-components-componentsglass)
   - [3.2 Motion & Animation Components (`components/motion/*`)](#32-motion--animation-components-componentsmotion)
   - [3.3 Public Layout & Navigation Components (`components/ui/*`)](#33-public-layout--navigation-components-componentsui)
4. [Every API Route (All 33 Routes under `app/api/`)](#4-every-api-route-all-33-routes-under-appapi)
   - [4.1 Administrative API Routes (`app/api/admin/*`)](#41-administrative-api-routes-appapiadmin)
   - [4.2 Authentication & User API Routes (`app/api/auth/*`)](#42-authentication--user-api-routes-appapiauth)
   - [4.3 Dashboard & Leadership API Routes](#43-dashboard--leadership-api-routes)
   - [4.4 MLM & Points API Routes](#44-mlm--points-api-routes)
   - [4.5 Recharge & Solar API Routes](#45-recharge--solar-api-routes)
   - [4.6 Support & Withdrawal API Routes](#46-support--withdrawal-api-routes)
5. [Business Logic Engines — Deep Dive](#5-business-logic-engines--deep-dive)
   - [5.1 MLM & Referral Commission Engine](#51-mlm--referral-commission-engine-libmlm-engineindexts)
   - [5.2 Solar Generation & Upgrade Engine](#52-solar-generation--upgrade-engine-libsolar-engine)
   - [5.3 Points & Reward Economy Engine](#53-points--reward-economy-engine-libpoints-engineindexts)
   - [5.4 Leadership Rank Progression Engine](#54-leadership-rank-progression-engine-libleadership-engineindexts)
   - [5.5 Withdrawal Processing Engine](#55-withdrawal-processing-engine-libwithdrawal-engineindexts)
   - [5.6 Security Rate Limiter](#56-security-rate-limiter-libsecurityrate-limiterts)
   - [5.7 Authentication, Guards & Transaction PIN](#57-authentication-guards--transaction-pin-libauth)
   - [5.8 Database Service Layer](#58-database-service-layer-libsupabasedbts)
6. [Database Architecture & Reconstructed Schema](#6-database-architecture--reconstructed-schema)
   - [6.1 Database Migrations Audit](#61-database-migrations-audit)
   - [6.2 Reconstructed Full Database Schema (19 Tables)](#62-reconstructed-full-database-schema-19-tables)
   - [6.3 Row-Level Security (RLS) Policy Audit](#63-row-level-security-rls-policy-audit)
   - [6.4 Entity-Relationship (ER) Diagram](#64-entity-relationship-er-diagram)
7. [Authentication & Security Audit](#7-authentication--security-audit)
   - [7.1 Authentication Architecture & Session Lifecycle](#71-authentication-architecture--session-lifecycle)
   - [7.2 Password Handling & Transaction PIN Security](#72-password-handling--transaction-pin-security)
   - [7.3 Privilege Separation (Admin vs Regular User)](#73-privilege-separation-admin-vs-regular-user)
   - [7.4 OWASP Top 10 (2021/2026) Vulnerability Assessment](#74-owasp-top-10-20212026-vulnerability-assessment)
   - [7.5 Hardcoded Secrets & Repository Exposure Audit](#75-hardcoded-secrets--repository-exposure-audit)
8. [App-Wide Flows & Architectural Workflows](#8-app-wide-flows--architectural-workflows)
   - [8.1 New User Journey: Registration to First Solar Plan Purchase](#81-new-user-journey-registration-to-first-solar-plan-purchase)
   - [8.2 Referral Network & MLM 3-Tier Commission Distribution Flow](#82-referral-network--mlm-3-tier-commission-distribution-flow)
   - [8.3 Complete Financial Lifecycle: Deposit to Payout](#83-complete-financial-lifecycle-deposit-to-payout)
   - [8.4 Super Admin Moderation & Operations Workflow](#84-super-admin-moderation--operations-workflow)
   - [8.5 Leadership Rank Promotion & Advancement Flow](#85-leadership-rank-promotion--advancement-flow)
9. [Testing, Quality Assurance & Type Safety](#9-testing-quality-assurance--type-safety)
   - [9.1 Existing Test Suite Inventory](#91-existing-test-suite-inventory)
   - [9.2 Critical Test Coverage Gaps](#92-critical-test-coverage-gaps)
   - [9.3 Type Safety & Linting Evaluation](#93-type-safety--linting-evaluation)
10. [Existing Internal Audit Cross-Check & Gap Analysis](#10-existing-internal-audit-cross-check--gap-analysis)
   - [10.1 PRODUCTION_AUDIT.md Claims vs Actual Code Reality](#101-production_auditmd-claims-vs-actual-code-reality)
   - [10.2 Seeding & Inventory Script Evaluation](#102-seeding--inventory-script-evaluation)
11. [Production-Readiness Verdict & Actionable Roadmap](#11-production-readiness-verdict--actionable-roadmap)
   - [11.1 Consolidated Production-Readiness Scorecard](#111-consolidated-production-readiness-scorecard)
   - [11.2 Top 10 P0 Blockers (Must Fix Before Handling Real Money)](#112-top-10-p0-blockers-must-fix-before-handling-real-money)
   - [11.3 Top 10 "Nice to Have" Improvements](#113-top-10-nice-to-have-improvements)
   - [11.4 Self-Check File Coverage Matrix](#114-self-check-file-coverage-matrix)

---

"""

    sections = [
        toc,
        generate_section_1(),
        generate_section_2(),
        generate_section_3(),
        generate_section_4(),
        generate_section_5(),
        generate_section_6(),
        generate_section_7(),
        generate_section_8(),
        generate_section_9(),
        generate_section_10(),
        generate_section_11(),
    ]
    
    with open(report_path, "w", encoding="utf-8") as f:
        for s in sections:
            f.write(s)
            f.write("\n\n")
            
    print(f"Successfully generated {report_path} (Size: {os.path.getsize(report_path)} bytes)")

if __name__ == "__main__":
    main()

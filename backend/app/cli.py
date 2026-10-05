"""Command-Line Interface for Database Management and Synthetic Data Seeding.

Usage:
  python -m app.cli init-db
  python -m app.cli seed-db [--seed 42]
  python -m app.cli validate-db
  python -m app.cli reset-db [--seed 42]
"""

import argparse
import sys

from app.core.database import SessionLocal, engine, init_db, reset_db
from app.seed import SEED, print_validation_report, seed_database, validate_dataset


def main():
    parser = argparse.ArgumentParser(
        description="Channel Partner Intelligence Database Management CLI"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init-db
    subparsers.add_parser("init-db", help="Create database tables if not exist")

    # seed-db
    seed_parser = subparsers.add_parser(
        "seed-db", help="Seed database with deterministic synthetic data"
    )
    seed_parser.add_argument(
        "--seed",
        type=int,
        default=SEED,
        help=f"Random seed (default: {SEED})",
    )

    # validate-db
    subparsers.add_parser(
        "validate-db", help="Validate data integrity and funnel consistency"
    )

    # reset-db
    reset_parser = subparsers.add_parser(
        "reset-db",
        help="Drop, recreate tables and reseed with synthetic dataset",
    )
    reset_parser.add_argument(
        "--seed",
        type=int,
        default=SEED,
        help=f"Random seed (default: {SEED})",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "init-db":
        print("Initializing database schema...")
        init_db(engine)
        print("Database schema successfully initialized.")

    elif args.command == "seed-db":
        print(
            f"Initializing schema and seeding database with SEED={args.seed}..."
        )
        init_db(engine)
        with SessionLocal() as session:
            counts = seed_database(session, seed=args.seed)
            print("Database seeded successfully:")
            for entity, count in counts.items():
                print(f"  - {entity:<20}: {count}")

    elif args.command == "validate-db":
        print("Executing data integrity and funnel validation...")
        with SessionLocal() as session:
            report = validate_dataset(session)
            print_validation_report(report)
            if not report.passed:
                sys.exit(1)

    elif args.command == "reset-db":
        print(f"Resetting database tables and reseeding with SEED={args.seed}...")
        reset_db(engine)
        with SessionLocal() as session:
            counts = seed_database(session, seed=args.seed)
            print("Database reset and seeded successfully:")
            for entity, count in counts.items():
                print(f"  - {entity:<20}: {count}")
            print("\nRunning validation on fresh seed...")
            report = validate_dataset(session)
            print_validation_report(report)
            if not report.passed:
                sys.exit(1)


if __name__ == "__main__":
    main()

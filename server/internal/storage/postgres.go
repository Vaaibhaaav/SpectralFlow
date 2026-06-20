package storage

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DatabaseEngine struct {
	Pool *pgxpool.Pool
}

func Config(connStr string) *pgxpool.Config {
	const defaultMaxConns = int32(8)
	const defaultMinConns = int32(2)
	const defaultMaxConnLifetime = time.Hour
	const defaultMaxConnIdleTime = time.Minute * 30
	const defaultHealthCheckPeriod = time.Minute
	const defaultConnectTimeout = time.Second * 5

	dbConfig, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		log.Fatal("Failed to create a config, error: ", err)
	}

	dbConfig.MaxConns = defaultMaxConns
	dbConfig.MinConns = defaultMinConns
	dbConfig.MaxConnLifetime = defaultMaxConnLifetime
	dbConfig.MaxConnIdleTime = defaultMaxConnIdleTime
	dbConfig.HealthCheckPeriod = defaultHealthCheckPeriod
	dbConfig.ConnConfig.ConnectTimeout = defaultConnectTimeout

	return dbConfig
}

func NewDatabaseEngine(connStr string) (*DatabaseEngine, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	connPool, err := pgxpool.NewWithConfig(ctx, Config(connStr))
	if err != nil {
		log.Fatal("Error while creating connection to the database!!")
	}

	if err := connPool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("database connection verification failed: %w", err)
	}

	log.Println("TimescaleDB connection pool successfully verified.")
	return &DatabaseEngine{Pool: connPool}, nil

}

func (db *DatabaseEngine) Close() {
	if db.Pool != nil {
		db.Pool.Close()
	}
}

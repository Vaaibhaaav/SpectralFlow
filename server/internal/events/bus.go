package events

import (
	"spectraflow/internal/models"
	"sync"
	"sync/atomic"
	"time"
)

type EventBus struct {
	mu                 sync.RWMutex
	traceSubscribers   map[string][]chan models.TraceEvent
	alertSubscribers   map[string][]chan models.AlertEvent
	retrainSubscribers map[string][]chan string
	dropped            uint64
}

func NewEventBus() *EventBus {
	return &EventBus{
		traceSubscribers:   make(map[string][]chan models.TraceEvent),
		alertSubscribers:   make(map[string][]chan models.AlertEvent),
		retrainSubscribers: make(map[string][]chan string),
	}
}

// It returns a channel for a specific topic like "drift", " eval" etc.
func (bus *EventBus) Subscribe(topic string, bufferSize int) chan models.TraceEvent {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	ch := make(chan models.TraceEvent, bufferSize)
	bus.traceSubscribers[topic] = append(bus.traceSubscribers[topic], ch)

	return ch
}

func (bus *EventBus) SubscribeAlerts(topic string, bufferSize int) chan models.AlertEvent {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	ch := make(chan models.AlertEvent, bufferSize)
	bus.alertSubscribers[topic] = append(bus.alertSubscribers[topic], ch)
	return ch
}

func (bus *EventBus) SubscribeRetrain(topic string,bufferSize int) chan string {
	bus.mu.Lock()
	defer bus.mu.Unlock()
	ch := make(chan string,bufferSize)
	bus.retrainSubscribers[topic] = append(bus.retrainSubscribers[topic],ch)
	return ch
}

func (bus *EventBus) Publish(event models.TraceEvent) {
	bus.mu.RLock()
	defer bus.mu.RUnlock()

	//Fan Out to all subscription topic currently active
	for topic, chans := range bus.traceSubscribers {
		for _, ch := range chans {
			select {
			case ch <- event:
				//Successfully added to channel event
			case <-time.After(100 * time.Millisecond):
				atomic.AddUint64(&bus.dropped, 1)
				_ = topic
			}
		}
	}
}

func (bus *EventBus) PublishAlerts(event models.AlertEvent) {
	bus.mu.RLock()
	defer bus.mu.RUnlock()

	for topic, chans := range bus.alertSubscribers {
		for _, ch := range chans {
			select {
			case ch <- event:
			case <-time.After(100 * time.Millisecond):
				atomic.AddUint64(&bus.dropped, 1)
				_ = topic
			}
		}
	}
}

func (bus *EventBus) PublishRetrains(appId string) {
	bus.mu.RLock()
	defer bus.mu.RUnlock()

	for topic, chans := range bus.retrainSubscribers {
		for _, ch := range chans {
			select {
			case ch <- appId:
			case <-time.After(100 * time.Millisecond):
				atomic.AddUint64(&bus.dropped, 1)
				_ = topic
			}
		}
	}
}

func (bus *EventBus) GetDroppedCount() uint64 {
	return atomic.LoadUint64(&bus.dropped)
}
